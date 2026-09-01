import { describe, expect, test } from 'vitest';
import { getOwnershipDiorama } from '../src/ui/building-shop.js';

describe('producer ownership diorama', () => {
  test('leaves an empty plot at zero ownership', () => {
    expect(getOwnershipDiorama(0)).toMatchObject({
      total: 0,
      groups: [],
      caption: 'Empty plot · ready for the first arrival',
    });
  });

  test('shows small collections one miniature at a time', () => {
    const display = getOwnershipDiorama(5);
    expect(display.groups).toEqual([1, 1, 1, 1, 1]);
    expect(display.caption).toBe('5 individual sites');
  });

  test('distributes larger collections exactly across eight districts', () => {
    const display = getOwnershipDiorama(10);
    expect(display.groups).toEqual([2, 2, 1, 1, 1, 1, 1, 1]);
    expect(display.groups.reduce((total, count) => total + count, 0)).toBe(10);
    expect(display.caption).toBe('8 little districts · 1–2 each');
  });

  test('keeps huge collections legible without adding more DOM slots', () => {
    const display = getOwnershipDiorama(1_000_003);
    expect(display.groups).toHaveLength(8);
    expect(display.groups.reduce((total, count) => total + count, 0)).toBe(1_000_003);
    expect(display.caption).toBe('8 little districts · 125,000–125,001 each');
  });
});
