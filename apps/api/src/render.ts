export function renderCaptcha(siteKey: string, guildId: string) {
  return `<!doctype html><meta charset="utf-8"><title>인증</title>
<style>
body{background:#0f1117;color:#e5e7eb;display:flex;min-height:100vh;align-items:center;justify-content:center;font-family:ui-sans-serif}
.card{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:28px;box-shadow:0 10px 30px rgba(0,0,0,.25);width:360px;text-align:center}
h1{font-size:18px;margin:0 0 8px} p{opacity:.8;margin:0 0 16px}
button{margin-top:16px;background:#5865F2;color:white;border:0;border-radius:8px;padding:10px 14px;cursor:pointer}
</style>
<div class="card">
  <h1>잠깐! 로봇이 아니신가요?</h1>
  <p>아래 인증을 완료해 주세요.</p>
  <form method="POST" action="/verify">
    <input type="hidden" name="guildId" value="\${guildId}">
    <div class="h-captcha" data-sitekey="\${siteKey}"></div>
    <button type="submit">인증하기</button>
  </form>
</div>
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>`;
}
