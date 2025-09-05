import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers], partials: [Partials.GuildMember] });

client.once('ready', () => console.log(`🤖 ${client.user?.tag} ready`));

client.on('interactionCreate', async (i) => {
  if (!i.isChatInputCommand()) return;
  try {
    if (i.commandName === 'issuekey') {
      await i.deferReply({ ephemeral: true });
      const { data } = await axios.post(`${process.env.API_BASE_URL}/cohort`, { guildId: i.guildId });
      const link = `${process.env.API_BASE_URL}/oauth/login?key=${encodeURIComponent(data.key)}`;
      await i.editReply(`🔑 복구키: \`${data.key}\`\n동의 링크: ${link}`);
    }
    if (i.commandName === 'restore') {
      const key = i.options.getString('key', true);
      await i.deferReply({ ephemeral: true });
      const { data } = await axios.post(`${process.env.API_BASE_URL}/restore/${encodeURIComponent(key)}`);
      await i.editReply(`⏳ 복구 시작! Job ID: \`${data.jobId}\``);
    }
    if (i.commandName === 'status') {
      const job = i.options.getString('job', true);
      const { data } = await axios.get(`${process.env.API_BASE_URL}/status/${encodeURIComponent(job)}`);
      await i.reply({ ephemeral: true, content: `상태: ${data.status} (${data.progress}%) ${data.error ?? ''}` });
    }
    if (i.commandName === 'verify_msg') {
      const url = `${process.env.API_BASE_URL}/verify?guild=${i.guildId}`;
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel('인증하기').setStyle(ButtonStyle.Link).setURL(url)
      );
      const embed = new EmbedBuilder().setTitle('Swasd Restoration | 복구봇').setDescription(`[여기](${url})에서 인증을 완료하세요.`).setColor(0x5865F2);
      await i.reply({ embeds: [embed], components: [row] });
    }
    if (i.commandName === 'set_log') {
      const ch = i.options.getChannel('channel', true);
      await prisma.guildSettings.upsert({ where: { guildId: i.guildId! }, create: { guildId: i.guildId!, logChannelId: ch.id }, update: { logChannelId: ch.id } });
      await i.reply({ ephemeral: true, content: `🪵 로그 채널: <#${ch.id}>` });
    }
    if (i.commandName === 'set_role') {
      const role = i.options.getRole('role', true);
      await prisma.guildSettings.upsert({ where: { guildId: i.guildId! }, create: { guildId: i.guildId!, verifiedRoleId: role.id }, update: { verifiedRoleId: role.id } });
      await i.reply({ ephemeral: true, content: `✅ 인증 역할: <@&${role.id}>` });
    }
  } catch (e: any) {
    console.error(e);
    if (i.deferred || i.replied) await i.editReply('❌ 오류: ' + (e.response?.data?.error ?? e.message));
    else await i.reply({ ephemeral: true, content: '❌ 오류가 발생했습니다.' });
  }
});

client.login(process.env.DISCORD_TOKEN);
