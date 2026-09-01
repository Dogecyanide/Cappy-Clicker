import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const databaseName = 'cappy-clicker-leaderboard';
const workerRoot = fileURLToPath(new URL('../', import.meta.url));
const configUrl = new URL('../wrangler.jsonc', import.meta.url);
const wranglerPath = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));

if (!existsSync(wranglerPath)) {
  console.error('Wrangler is not installed. Run `npm install` in worker/leaderboard first.');
  process.exit(1);
}

let databaseId = findExistingDatabase();
if (databaseId) {
  console.log(`Using the existing Cloudflare D1 database named ${databaseName}.`);
} else {
  const created = runWrangler(['d1', 'create', databaseName]);
  process.stdout.write(created.stdout);
  process.stderr.write(created.stderr);
  databaseId = findUuid(`${created.stdout}\n${created.stderr}`);
  if (!databaseId) {
    console.error('Cloudflare created the database, but its ID could not be read from Wrangler output.');
    process.exit(1);
  }
}

const source = await readFile(configUrl, 'utf8');
const config = JSON.parse(source);
const database = config.d1_databases?.find((entry) => entry.binding === 'DB');
if (!database) {
  console.error('wrangler.jsonc does not contain the expected D1 binding named DB.');
  process.exit(1);
}
database.database_name = databaseName;
database.database_id = databaseId;
await writeFile(configUrl, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Connected DB in wrangler.jsonc (${databaseId}).`);

function findExistingDatabase() {
  const listed = runWrangler(['d1', 'list', '--json']);
  let databases;
  try {
    databases = JSON.parse(stripAnsi(listed.stdout));
  } catch {
    process.stdout.write(listed.stdout);
    process.stderr.write(listed.stderr);
    console.error('Could not read the Cloudflare D1 database list.');
    process.exit(1);
  }
  const rows = Array.isArray(databases) ? databases : databases.result ?? databases.databases ?? [];
  const match = rows.find((database) => database.name === databaseName);
  return match ? String(match.uuid ?? match.id ?? '') : '';
}

function runWrangler(args) {
  const result = spawnSync(process.execPath, [wranglerPath, ...args], {
    cwd: workerRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    process.exit(result.status ?? 1);
  }
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function findUuid(value) {
  return stripAnsi(value).match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i)?.[0] ?? '';
}

function stripAnsi(value) {
  return String(value).replace(/\u001b\[[0-9;]*m/g, '').trim();
}
