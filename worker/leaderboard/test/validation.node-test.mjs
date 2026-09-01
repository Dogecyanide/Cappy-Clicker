import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ValidationError,
  buildAbuseFlags,
  parseGameDecimal,
  sanitizePlayerName,
  shouldHoldForReview,
  validateSubmissionPayload,
} from '../src/validation.js';

const validPayload = () => ({
  playerToken: '8a189672-509b-4a7c-b44f-98e8e82deade',
  name: 'Captain Cappy',
  metric: 'lifetime',
  scoreLog10: 42,
  displayValue: '1e42',
  metadata: {
    cps: '2.5e30',
    lifetime: '1e42',
    producers: 1_000,
    upgrades: 100,
    achievements: 150,
    moons: 10,
    playSeconds: 500_000,
    build: 'v2-grand-tour',
  },
});

test('parses game decimals without converting the full value to Number', () => {
  assert.equal(parseGameDecimal('2.5e100000').log10, 100000 + Math.log10(2.5));
  assert.equal(parseGameDecimal('0').log10, 0);
  assert.equal(parseGameDecimal('0.01').log10, -2);
});

test('normalizes player names while rejecting markup and links', () => {
  assert.equal(sanitizePlayerName('  Captain   Cappy  '), 'Captain Cappy');
  assert.throws(() => sanitizePlayerName('<b>Mario</b>'), ValidationError);
  assert.throws(() => sanitizePlayerName('https://spam.test'), ValidationError);
});

test('accepts the frontend submission contract', () => {
  const submission = validateSubmissionPayload(validPayload());
  assert.equal(submission.metric, 'lifetime');
  assert.equal(submission.metadata.build, 'v2-grand-tour');
});

test('accepts all 480 published upgrades and rejects counts above the catalogue', () => {
  const complete = validPayload();
  complete.metadata.upgrades = 480;
  assert.equal(validateSubmissionPayload(complete).metadata.upgrades, 480);

  const impossible = validPayload();
  impossible.metadata.upgrades = 481;
  assert.throws(() => validateSubmissionPayload(impossible), /metadata\.upgrades is outside/);
});

test('rejects a score that disagrees with its display or metadata value', () => {
  const wrongLog = validPayload();
  wrongLog.scoreLog10 = 41;
  assert.throws(() => validateSubmissionPayload(wrongLog), /does not match displayValue/);

  const wrongMetadata = validPayload();
  wrongMetadata.metadata.lifetime = '1e41';
  assert.throws(() => validateSubmissionPayload(wrongMetadata), /does not match metadata/);

  const zeroMismatch = validPayload();
  zeroMismatch.scoreLog10 = 0;
  zeroMismatch.displayValue = '0';
  zeroMismatch.metadata.lifetime = '1';
  assert.throws(() => validateSubmissionPayload(zeroMismatch), /does not match metadata/);
});

test('holds implausibly fast growth and rapid jumps out of public ranks', () => {
  const payload = validPayload();
  payload.metadata.playSeconds = 60;
  const submission = validateSubmissionPayload(payload);
  const flags = buildAbuseFlags(submission, {
    previousScore: { score_log10: 1, submitted_at: Date.now() - 5_000 },
    now: Date.now(),
  });
  assert.ok(flags.includes('very_fast_growth'));
  assert.ok(flags.includes('rapid_score_jump'));
  assert.equal(shouldHoldForReview(flags), true);
});
