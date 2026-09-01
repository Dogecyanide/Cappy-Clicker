import { randomBytes } from 'node:crypto';

// This value is intentionally written only to stdout so Wrangler can read it
// from the pipe without saving the production secret in the repository.
process.stdout.write(randomBytes(48).toString('hex'));
