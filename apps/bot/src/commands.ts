import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder().setName('issuekey').setDescription('복구키 발급'),
  new SlashCommandBuilder().setName('restore').setDescription('복구 시작').addStringOption(o=>o.setName('key').setDescription('복구키').setRequired(true)),
  new SlashCommandBuilder().setName('status').setDescription('복구 상태').addStringOption(o=>o.setName('job').setDescription('job id').setRequired(true)),
  new SlashCommandBuilder().setName('verify_msg').setDescription('인증 안내 메시지'),
  new SlashCommandBuilder().setName('set_log').setDescription('로그 채널 설정').addChannelOption(o=>o.setName('channel').setDescription('채널').setRequired(true)),
  new SlashCommandBuilder().setName('set_role').setDescription('인증 역할 설정').addRoleOption(o=>o.setName('role').setDescription('역할').setRequired(true))
].map(c=>c.toJSON());
