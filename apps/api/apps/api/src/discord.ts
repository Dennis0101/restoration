import axios from 'axios';
const base = 'https://discord.com/api/v10';

export async function oauthExchange(code: string, redirect: string) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code, redirect_uri: redirect
  });
  const { data } = await axios.post(`${base}/oauth2/token`, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
  return data as { access_token:string; refresh_token:string; scope:string; expires_in:number };
}
export async function oauthRefresh(refresh: string) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'refresh_token',
    refresh_token: refresh
  });
  const { data } = await axios.post(`${base}/oauth2/token`, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
  return data as { access_token:string; refresh_token:string; scope:string; expires_in:number };
}
export async function me(access: string) {
  const { data } = await axios.get(`${base}/users/@me`, { headers: { Authorization: `Bearer ${access}` }});
  return data as { id:string; username:string; global_name?:string|null };
}
export async function getMember(guildId: string, userId: string) {
  try {
    const { data } = await axios.get(`${base}/guilds/${guildId}/members/${userId}`, { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }});
    return data as { roles: string[] } | null;
  } catch (e: any) { if (e.response?.status === 404) return null; throw e; }
}
export const guildsJoin = (guildId:string, userId:string, access:string) =>
  axios.put(`${base}/guilds/${guildId}/members/${userId}`, { access_token: access }, { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }, validateStatus:()=>true });
export const patchRoles = (guildId:string, userId:string, roles:string[]) =>
  axios.patch(`${base}/guilds/${guildId}/members/${userId}`, { roles }, { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }, validateStatus:()=>true });
export const postToChannel = (channelId:string, payload:any) =>
  axios.post(`${base}/channels/${channelId}/messages`, payload, { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }, validateStatus:()=>true });
