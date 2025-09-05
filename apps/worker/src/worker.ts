import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { oauthRefresh, guildsJoin, patchRoles } from '../../api/src/discord';
import { dec, enc } from '../../../packages/shared/src/crypto';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL!);

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

new Worker('restore', async job => {
  const jobId = job.data.jobId as string;
  const row = await prisma.restoreJob.update({ where: { id: jobId }, data: { status: 'running', progress: 0 } });
  const cohort = await prisma.recoveryCohort.findUnique({ where: { id: row.cohortId } });
  if (!cohort) throw new Error('cohort not found');

  const members = await prisma.recoveryMember.findMany({ where: { cohortId: cohort.id } });
  let done = 0;

  for (const m of members) {
    try {
      let access = dec(m.accessTokenEnc);
      if (m.tokenExpiresAt.getTime() - Date.now() < 60_000) {
        const t = await oauthRefresh(dec(m.refreshTokenEnc));
        access = t.access_token;
        await prisma.recoveryMember.update({
          where: { id: m.id },
          data: {
            accessTokenEnc: enc(t.access_token),
            refreshTokenEnc: enc(t.refresh_token),
            tokenScope: t.scope,
            tokenExpiresAt: new Date(Date.now() + t.expires_in * 1000)
          }
        });
      }
      const res = await guildsJoin(cohort.guildId, m.userId, access);
      if (res.status === 201 || res.status === 204) {
        if (m.roleSnapshot) {
          const roles = (m.roleSnapshot as any).roleIds as string[];
          await patchRoles(cohort.guildId, m.userId, roles);
        }
      }
    } catch (e) {
      console.error('restore member failed', m.userId, (e as any)?.message);
    }
    done++;
    await prisma.restoreJob.update({ where: { id: jobId }, data: { progress: Math.round((done / members.length) * 100) } });
    await sleep(300);
  }

  await prisma.restoreJob.update({ where: { id: jobId }, data: { status: 'completed', progress: 100 } });
}, { connection });
