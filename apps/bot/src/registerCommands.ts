import { REST, Routes } from 'discord.js';
import { commands } from './commands';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

async function main() {
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), { body: commands });
  console.log('✅ Global slash commands registered');
}
main().catch(console.error);
