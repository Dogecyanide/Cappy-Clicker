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

const SHORT_SCALE = [
  '', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion',
  'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion', 'undecillion',
  'duodecillion', 'tredecillion', 'quattuordecillion', 'quindecillion',
  'sexdecillion', 'septendecillion', 'octodecillion', 'novemdecillion', 'vigintillion',
];

export function format(value, precision = 3) {
  const number = D(value);
  if (!isFiniteDecimal(number)) return '0';
  if (number.eq(0)) return '0';
  const sign = number.lt(0) ? '-' : '';
  const absolute = number.abs();
  if (absolute.lt(0.01)) return `${sign}${absolute.toExponential(Math.max(1, precision - 1))}`;
  if (absolute.lt(1_000)) {
    const places = absolute.lt(10) ? 2 : absolute.lt(100) ? 1 : 0;
    return `${sign}${Number(absolute.toNumber().toFixed(places)).toLocaleString('en-US')}`;
  }
  const exponent = absolute.exponent;
  const group = Math.floor(exponent / 3);
  if (group < SHORT_SCALE.length) {
    const scaled = absolute.div(Decimal.pow(1000, group)).toNumber();
    const places = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
    return `${sign}${scaled.toFixed(places)} ${SHORT_SCALE[group]}`;
  }
  return `${sign}${absolute.toExponential(Math.max(1, precision - 1)).replace('+', '')}`;
}

export function formatInteger(value) {
  const number = D(value).floor();
  if (number.lt(1e6)) return number.toNumber().toLocaleString('en-US');
  return format(number, 4);
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
