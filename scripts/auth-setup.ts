import { randomBytes } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
let content = await readFile('.env.local', 'utf8').catch(() => '');
if (!/^BETTER_AUTH_SECRET=.+$/m.test(content)) {
  content = content.replace(/^BETTER_AUTH_SECRET=.*\n?/m, '');
  content += `\nBETTER_AUTH_SECRET=${randomBytes(48).toString('base64url')}\n`;
}
for (const [key, value] of Object.entries({ BETTER_AUTH_URL: 'http://127.0.0.1:3100', AUTH_MAIL_MODE: 'local' })) if (!new RegExp(`^${key}=`, 'm').test(content)) content += `${key}=${value}\n`;
await writeFile('.env.local', content, { mode: 0o600 }); await chmod('.env.local', 0o600);
console.log('Configuration locale préparée, secret conservé sans affichage.');
