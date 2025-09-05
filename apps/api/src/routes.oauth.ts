import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { oauthExchange, me, getMember } from './discord';
import { enc } from '../../../packages/shared/src/crypto';

const prisma = new PrismaClient();
export const oauthRouter = Router();
const redirect = process.env.OAUTH_REDIRECT_URI!;

oauthRouter.get('/login', (req, res) => {
  const key = String(req.query.key ?? '');
  if (!key) return res.status(400).send('key required');
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID!);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('scope', 'identify guilds.join');
  url.searchParams.set('state', key);
  res.redirect(url.toString());
});

oauthRouter.get('/callback', async (req, res) => {
  try {
    const code = String(req.query.code ?? '');
    const key  = String(req.query.state ?? '');
    if (!code || !key) return res.status(400).send('missing code/state');

    const cohort = await prisma.recoveryCohort.findUnique({ where: { key } });
    if (!cohort) return res.status(400).send('invalid key');

    const t = await oauthExchange(code, redirect);
    const user = await me(t.access_token);

    let roleSnapshot: any = null;
    const m = await getMember(cohort.guildId, user.id);
    if (m) roleSnapshot = { roleIds: m.roles, takenAt: new Date().toISOString() };

    await prisma.recoveryMember.upsert({
      where: { cohortId_userId: { cohortId: cohort.id, userId: user.id } },
      update: {
        accessTokenEnc: enc(t.access_token),
        refreshTokenEnc: enc(t.refresh_token),
        tokenScope: t.scope,
        tokenExpiresAt: new Date(Date.now() + t.expires_in * 1000),
        roleSnapshot
      },
      create: {
        cohortId: cohort.id, userId: user.id,
        accessTokenEnc: enc(t.access_token),
        refreshTokenEnc: enc(t.refresh_token),
        tokenScope: t.scope,
        tokenExpiresAt: new Date(Date.now() + t.expires_in * 1000),
        roleSnapshot
      }
    });

    res.send('✅ 등록 완료! 복구 시 자동 참여/역할 복원이 가능합니다.');
  } catch (e: any) {
    res.status(500).send('OAuth error: ' + (e.response?.data?.error_description ?? e.message));
  }
});
