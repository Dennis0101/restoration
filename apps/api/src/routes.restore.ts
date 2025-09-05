import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const prisma = new PrismaClient();
export const restoreRouter = Router();
const connection = new IORedis(process.env.REDIS_URL!);
const restoreQueue = new Queue('restore', { connection });

restoreRouter.post('/restore/:key', async (req, res) => {
  const key = req.params.key;
  const cohort = await prisma.recoveryCohort.findUnique({ where: { key } });
  if (!cohort) return res.status(404).json({ error: 'invalid key' });
  const job = await prisma.restoreJob.create({ data: { cohortId: cohort.id, guildId: cohort.guildId } });
  await restoreQueue.add('restore', { jobId: job.id }, { removeOnComplete: true });
  res.json({ jobId: job.id });
});

restoreRouter.get('/status/:jobId', async (req, res) => {
  const job = await prisma.restoreJob.findUnique({ where: { id: String(req.params.jobId) } });
  if (!job) return res.status(404).json({ error: 'not found' });
  res.json({ status: job.status, progress: job.progress, error: job.error });
});
