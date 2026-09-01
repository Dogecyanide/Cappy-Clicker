import { readFile } from 'node:fs/promises';

const configUrl = new URL('../wrangler.jsonc', import.meta.url);
const config = JSON.parse(await readFile(configUrl, 'utf8'));
const database = config.d1_databases?.find((entry) => entry.binding === 'DB');
const databaseId = String(database?.database_id ?? '').trim();
const allowedOrigins = String(config.vars?.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const problems = [];
if (!database) problems.push('The D1 binding named DB is missing.');
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(databaseId)) {
  problems.push('The D1 database ID is still a placeholder. Run `npm run cloud:create`.');
}
if (!allowedOrigins.includes('https://dogecyanide.github.io')) {
  problems.push('ALLOWED_ORIGINS must include https://dogecyanide.github.io for the Pages game.');
}
if (Object.hasOwn(config.vars ?? {}, 'TOKEN_PEPPER')) {
  problems.push('TOKEN_PEPPER must be a Cloudflare secret, never a public Wrangler variable.');
}

if (problems.length) {
  console.error('Open League cloud configuration is not ready:\n');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log('Open League cloud configuration is ready for migration or deployment.');
}
