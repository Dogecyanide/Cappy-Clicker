import Decimal from 'break_infinity.js';

export { Decimal };

export function D(value = 0) {
  if (value instanceof Decimal) return value;
  if (value === null || value === undefined || value === '') return new Decimal(0);
  try {
    const result = new Decimal(value);
    return isFiniteDecimal(result) ? result : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
}

export function clampDecimal(value, min = 0, max = '1e1000000') {
  return Decimal.max(D(min), Decimal.min(D(max), D(value)));
}

const SMALL_ILLIONS = [
  '', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion',
  'sextillion', 'septillion', 'octillion', 'nonillion',
];
const ILLION_UNITS = ['', 'un', 'duo', 'tre', 'quattuor', 'quin', 'sex', 'septen', 'octo', 'novem'];
const ILLION_TENS = ['', 'dec', 'vigint', 'trigint', 'quadragint', 'quinquagint', 'sexagint', 'septuagint', 'octogint', 'nonagint'];

export function shortScaleName(group) {
  if (group === 0) return '';
  if (group === 1) return 'thousand';
  const illion = group - 1;
  if (illion < SMALL_ILLIONS.length) return SMALL_ILLIONS[illion];
  if (illion === 100) return 'centillion';
  if (illion > 100) return '';
  const tens = Math.floor(illion / 10);
  const units = illion % 10;
  return `${ILLION_UNITS[units]}${ILLION_TENS[tens]}illion`;
}

export function format(value, precision = 3) {
  const number = D(value);
  const places = Math.max(0, Math.min(12, Math.floor(Number(precision) || 0)));
  if (!isFiniteDecimal(number)) return fixedZero(places);
  if (number.eq(0)) return fixedZero(places);
  const sign = number.lt(0) ? '-' : '';
  const absolute = number.abs();
  if (absolute.lt(Decimal.pow(10, -places))) return `${sign}${absolute.toExponential(places).replace('+', '')}`;
  if (absolute.lt(1_000)) {
    return `${sign}${absolute.toNumber().toLocaleString('en-US', {
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    })}`;
  }
  const exponent = absolute.exponent;
  const group = Math.floor(exponent / 3);
  const scaleName = shortScaleName(group);
  if (scaleName) {
    const scaled = absolute.div(Decimal.pow(1000, group)).toNumber();
    return `${sign}${scaled.toFixed(places)} ${scaleName}`;
  }
  return `${sign}${absolute.toExponential(places).replace('+', '')}`;
}

export function formatInteger(value) {
  const number = D(value).floor();
  if (number.lt(1e6)) return number.toNumber().toLocaleString('en-US');
  return format(number);
}

function fixedZero(places) {
  return places > 0 ? `0.${'0'.repeat(places)}` : '0';
}

export function safeNumber(value, fallback = 0) {
  const result = D(value).toNumber();
  return Number.isFinite(result) ? result : fallback;
}

export function sum(values) {
  return values.reduce((total, value) => total.add(D(value)), D(0));
}

export function isFiniteDecimal(value) {
  if (!(value instanceof Decimal) || !Number.isFinite(value.mantissa) || !Number.isFinite(value.exponent)) return false;
  // break_infinity.js represents parsed Infinity with a finite sentinel exponent,
  // so checking the backing fields alone is not sufficient.
  const serialized = value.toString();
  return serialized !== 'Infinity' && serialized !== '-Infinity' && serialized !== 'NaN';
}
