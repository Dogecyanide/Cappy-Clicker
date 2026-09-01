import { describe, expect, test } from 'vitest';
import { format, formatInteger } from '../src/core/numbers.js';

describe('number display', () => {
  test('keeps three decimal places for coin and production feedback', () => {
    expect(format(0)).toBe('0.000');
    expect(format(0.8)).toBe('0.800');
    expect(format(12.3456)).toBe('12.346');
    expect(format(999.9994)).toBe('999.999');
  });

  test('keeps three decimal places after switching to named scales', () => {
    expect(format(1_000)).toBe('1.000 thousand');
    expect(format(1_234_567)).toBe('1.235 million');
    expect(format('9.87654e303')).toBe('9.877 centillion');
    expect(formatInteger(1_234_567)).toBe('1.235 million');
  });

  test('uses scientific notation only when a value is too small or too large for the named display', () => {
    expect(format(0.0001)).toBe('1.000e-4');
    expect(format('1e306')).toBe('1.000e306');
  });
});
