/* eslint-disable */
// Bakes deploy-time public config into the production Angular environment
// before `ng build`. Values come from build args / env (see frontend/Dockerfile).
// Only PUBLIC values belong here — never secrets (the bundle ships to browsers).
const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '../src/environments/environment.production.ts');
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const captchaSiteKey = process.env.CAPTCHA_SITE_KEY || '';

let src = fs.readFileSync(file, 'utf8');
src = src.replace(/vapidPublicKey:\s*'[^']*'/, `vapidPublicKey: '${vapidPublicKey}'`);
src = src.replace(/captchaSiteKey:\s*'[^']*'/, `captchaSiteKey: '${captchaSiteKey}'`);
fs.writeFileSync(file, src);

console.log(`[inject-env] vapidPublicKey ${vapidPublicKey ? 'set' : 'left empty'}`);
console.log(`[inject-env] captchaSiteKey ${captchaSiteKey ? 'set' : 'left empty'}`);
