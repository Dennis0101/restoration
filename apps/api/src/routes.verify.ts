import { Router } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { renderCaptcha } from './render';
import { postToChannel, patchRoles } from './discord';

export const verifyRouter = Router();
const prisma = new PrismaClient();
const urlencoded = require('express').urlencoded;

verifyRouter.get('/verify', async (req, res) => {
  const guildId = String(req.query.guild ?? '');
  if (!guildId) return res.status(400).send('Missing guild');
  res.setHeader('Content-Type', 'text/html').send(renderCaptcha(process.env.HCAPTCHA_SITEKEY!, guildId));
});

verifyRouter.post('/verify', urlencoded({ extended: true }), async (req, res) => {
  try {
    const { 'h-captcha-response': token, guildId } = req.body as any;
    if (!token || !guildId) return res.status(400).send('Bad request');

    const { data: cap } = await axios.post(
      'https://hcaptcha.com/siteverify',
      new URLSearchParams({ secret: process.env.HCAPTCHA_SECRET!, response: token }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    if (!cap.success) return res.status(400).send('Captcha failed');

    // ⚠️ MVP: userId를 쿼리로 받음 (?user=123). 운영시 OAuth identify로 세션 구현 권장
    const userId = String(req.query.user ?? '');
    if (!userId) return res.status(401).send('로그인이 필요합니다 (?user=USER_ID)');

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const ua = String(req.headers['user-agent'] ?? '');

    const set = await prisma.guildSettings.findUnique({ where: { guildId } });
    const passed = true;

    await prisma.verificationLog.create({ data: { guildId, userId, ip, ua, passed } });

    if (passed && set?.verifiedRoleId) {
      await patchRoles(guildId, userId, [set.verifiedRoleId]); // 주의: 실제로는 merge 필요
    }
    if (set?.logChannelId) {
      await postToChannel(set.logChannelId, {
        embeds: [{
          title: passed ? '✅ 인증 성공' : '❌ 인증 실패',
          fields: [{ name: '유저', value: `<@${userId}>`, inline: true }, { name: 'IP', value: ip || '미수집', inline: true }],
          timestamp: new Date().toISOString()
        }]
      });
    }
    res.send('인증 완료! 창을 닫아주세요.');
  } catch (e: any) {
    console.error(e); res.status(500).send('Server error');
  }
});
