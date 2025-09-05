import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
export const cohortRouter = Router();

cohortRouter.post('/', async (req, res) => {
  const { guildId } = req.body as { guildId: string };
  if (!guildId) return res.status(400).json({ error: 'guildId required' });
  await prisma.guild.upsert({ where: { id: guildId }, update: {}, create: { id: guildId } });
  const key = crypto.randomBytes(5).toString('hex');
  const c = await prisma.recoveryCohort.create({ data: { guildId, key } });
  res.json({ key: c.key, oauth: `${process.env.API_BASE_URL}/oauth/login?key=${c.key}` });
});
