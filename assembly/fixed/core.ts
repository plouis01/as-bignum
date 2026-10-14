import { CharCode } from "util/string";
import {
  MAX_WORDS,
  wordsClear, wordsNeg, wordsMul, wordsDivRem, wordsShl, wordsShr, wordsSqrt,
  wordsZeroFrom, wordsMulAddSmall, wordsToString, wordsLength,
} from "../multiword";

// Fixed point arithmetic on signed two's complement numbers of `n` 32-bit digits (n = 4
// for fp128, 8 for fp256) with `F` fractional bits: a raw value `r` stands for r / 2^F.
//
// Operations work on the magnitudes and round toward zero, like integer division in
// Solidity. They compute the exact result in double width, then store its low `n`
// digits into `out` (wrapping around) and return true if it didn't fit, so that checked
// types can throw.
//
// `a`, `b` and `out` point to the raw values: the fields of an i128 / i256 are stored as
// little-endian u64, which are also little-endian 32-bit digits.

// Set by every operation: true if the last result didn't fit (it wrapped around)
let fixedOverflow = false;

// @ts-ignore: decorator
@inline export function getFixedOverflow(): bool {
  return fixedOverflow;
}

// @ts-ignore: decorator
@inline export function setFixedOverflow(value: bool): void {
  fixedOverflow = value;
}

/**
 * Number of fractional bits given by the tag type `Q`: its size in bits (see types.ts)
 */
// @ts-ignore: decorator
@inline export function fractBitsOf<Q>(): i32 {
  return isReference<Q>() ? 8 * <i32>offsetof<Q>() : 8 * <i32>sizeof<Q>();
}

// @ts-ignore: decorator
@lazy const W = MAX_WORDS * 2 + 2; // double width plus room for carries
// @ts-ignore: decorator
@lazy const fpA = memory.data(W << 2, 8);
// @ts-ignore: decorator
@lazy const fpB = memory.data(W << 2, 8);
// @ts-ignore: decorator
@lazy const fpP = memory.data(W << 2, 8);
// @ts-ignore: decorator
@lazy const fpQ = memory.data(W << 2, 8);
// @ts-ignore: decorator
@lazy const fpR = memory.data(W << 2, 8);

// @ts-ignore: decorator
@inline function isNeg(ptr: usize, n: i32): bool {
  return (load<u32>(ptr + (<usize>(n - 1) << 2)) >>> 31) != 0;
}

/** dst[0..m) = |src[0..n)|, returns true if src is negative */
function magnitude(src: usize, n: i32, dst: usize, m: i32): bool {
  wordsClear(dst, m);
  memory.copy(dst, src, <usize>n << 2);
  var neg = isNeg(src, n);
  if (neg) wordsNeg(dst, n);
  return neg;
}

/**
 * out[0..n) = (neg ? -mag : mag) keeping the low n digits. Returns true if the signed
 * result doesn't fit in n digits.
 */
function finish(mag: usize, m: i32, neg: bool, n: i32, out: usize): bool {
  var overflow = !wordsZeroFrom(mag, n, m);
  var top = load<u32>(mag + (<usize>(n - 1) << 2));
  if (top >>> 31) {
    // |result| >= 2^(32n - 1): only -2^(32n - 1) fits
    if (!neg || top != 0x80000000 || !wordsZeroFrom(mag, 0, n - 1)) overflow = true;
  }
  memory.copy(out, mag, <usize>n << 2);
  if (neg) wordsNeg(out, n);
  return overflow;
}

/** out = a * b */
export function fixedMul(a: usize, b: usize, n: i32, F: i32, out: usize): bool {
  var negA = magnitude(a, n, fpA, n);
  var negB = magnitude(b, n, fpB, n);
  wordsMul(fpA, n, fpB, n, fpP);
  wordsShr(fpP, 2 * n, F, fpP);
  return fixedOverflow = finish(fpP, 2 * n, negA != negB, n, out);
}

/** out = a / b, throws if b is zero */
export function fixedDiv(a: usize, b: usize, n: i32, F: i32, out: usize): bool {
  var negA = magnitude(a, n, fpA, 2 * n);
  var negB = magnitude(b, n, fpB, n);
  if (wordsLength(fpB, n) == 0) throw new RangeError("Division by zero");
  wordsShl(fpA, 2 * n, F, fpA);
  wordsDivRem(fpA, 2 * n, fpB, n, fpQ, fpR);
  return fixedOverflow = finish(fpQ, 2 * n, negA != negB, n, out);
}

/** out = sqrt(a), throws if a is negative */
export function fixedSqrt(a: usize, n: i32, F: i32, out: usize): void {
  if (isNeg(a, n)) throw new RangeError("Square root of a negative number");
  // sqrt(r / 2^F) = sqrt(r * 2^F) / 2^F
  magnitude(a, n, fpA, 2 * n);
  wordsShl(fpA, 2 * n, F, fpA);
  wordsSqrt(fpA, 2 * n, fpQ);
  // the root of a number below 2^(32n - 1 + F) is below 2^(32n - 1) when F < 32n
  memory.copy(out, fpQ, <usize>n << 2);
}

/**
 * Format `a` in base 10. `decimals` < 0 prints all the fractional digits (the decimal
 * expansion of a binary fraction is finite), otherwise exactly `decimals` digits
 * (truncated toward zero).
 */
export function fixedToString(a: usize, n: i32, F: i32, decimals: i32): string {
  var neg = magnitude(a, n, fpA, n + 1);
  // integer part
  wordsShr(fpA, n, F, fpB);
  var result = wordsToString(fpB, n, 10);
  // fractional part: keep the low F bits
  wordsShl(fpA, n + 1, (n + 1) * 32 - F, fpA);
  wordsShr(fpA, n + 1, (n + 1) * 32 - F, fpA);
  var hasFract = wordsLength(fpA, n + 1) != 0;
  if (decimals != 0 && (hasFract || decimals > 0)) {
    result += ".";
    let count = 0;
    let trailing = 0; // length without trailing zeros
    while (decimals < 0 ? wordsLength(fpA, n + 1) != 0 : count < decimals) {
      // next digit = (fract * 10) >> F
      wordsMulAddSmall(fpA, n + 1, 10, 0);
      wordsShr(fpA, n + 1, F, fpB);
      let digit = load<u32>(fpB);
      result += String.fromCharCode(CharCode._0 + <i32>digit);
      ++count;
      if (digit != 0) trailing = count;
      wordsShl(fpA, n + 1, (n + 1) * 32 - F, fpA);
      wordsShr(fpA, n + 1, (n + 1) * 32 - F, fpA);
    }
    if (decimals < 0) result = result.substring(0, result.length - (count - trailing));
  }
  // no sign when every printed digit is zero (e.g. -0.25 with 0 decimals)
  if (neg) {
    for (let i = 0, len = result.length; i < len; ++i) {
      let code = result.charCodeAt(i);
      if (code > CharCode._0 && code <= CharCode._9) return "-" + result;
    }
  }
  return result;
}

// @ts-ignore: decorator
@lazy const MAX_FRACT_DIGITS = 255; // the exact representation has at most 254 digits

/**
 * Parse a decimal string such as `-12.375` (optional sign, digits, optional `.` and
 * fractional digits, stops at the first other character). The fraction is rounded toward
 * zero to the nearest multiple of 2^-F; fractional digits after the 255th are ignored
 * (the exact value of a number with F fractional bits has F fractional digits).
 * Returns true if the value doesn't fit.
 */
export function fixedFromString(str: string, n: i32, F: i32, out: usize): bool {
  var m = 2 * n + 1;
  var len = str.length;
  var index = 0;
  var neg = false;
  if (len) {
    let first = str.charCodeAt(0);
    neg = first == CharCode.MINUS;
    if (neg || first == CharCode.PLUS) ++index;
  }
  // integer part into fpA (m digits), remembering if it overflowed
  wordsClear(fpA, m);
  var overflow = false;
  for (; index < len; ++index) {
    let d = <u32>(str.charCodeAt(index) - CharCode._0);
    if (d > 9) break;
    if (wordsMulAddSmall(fpA, m, 10, d)) overflow = true;
  }
  if (!wordsZeroFrom(fpA, n, m)) overflow = true;
  wordsShl(fpA, m, F, fpA);

  // fractional digits: fract * 2^F / 10^k, computed on MAX_WORDS digits
  // (fract < 10^255 < 2^848 and F < 256)
  if (index < len && str.charCodeAt(index) == CharCode.DOT) {
    ++index;
    let mf = MAX_WORDS;
    wordsClear(fpB, mf);
    wordsClear(fpP, mf);
    store<u32>(fpP, 1); // 10^k
    let k = 0;
    for (; index < len; ++index) {
      let d = <u32>(str.charCodeAt(index) - CharCode._0);
      if (d > 9) break;
      if (k < MAX_FRACT_DIGITS) {
        wordsMulAddSmall(fpB, mf, 10, d);
        wordsMulAddSmall(fpP, mf, 10, 0);
        ++k;
      }
    }
    if (k) {
      wordsShl(fpB, mf, F, fpB);
      wordsDivRem(fpB, mf, fpP, mf, fpQ, fpR);
      wordsClear(fpQ + (<usize>mf << 2), W - mf);
      // add to the integer part (the quotient is below 2^F)
      let c: u64 = 0;
      for (let i = 0; i < m; ++i) {
        let off = <usize>i << 2;
        let t = <u64>load<u32>(fpA + off) + <u64>load<u32>(fpQ + off) + c;
        store<u32>(fpA + off, <u32>t);
        c = t >> 32;
      }
    }
  }
  return fixedOverflow = finish(fpA, m, neg, n, out) || overflow;
}

/** out = a << F (an integer converted to fixed point) */
export function fixedFromInt(a: usize, n: i32, F: i32, out: usize): bool {
  var neg = magnitude(a, n, fpA, 2 * n);
  wordsShl(fpA, 2 * n, F, fpA);
  return fixedOverflow = finish(fpA, 2 * n, neg, n, out);
}

/** out = integer part of `a`, truncated toward zero */
export function fixedTrunc(a: usize, n: i32, F: i32, out: usize): void {
  var neg = magnitude(a, n, fpA, n);
  wordsShr(fpA, n, F, fpA);
  finish(fpA, n, neg, n, out);
}
