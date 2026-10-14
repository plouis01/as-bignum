import {
  MAX_WORDS,
  wordsClear, wordsNeg, wordsMul, wordsDivRem, wordsShl, wordsShr, wordsSqrt,
  wordsZeroFrom, wordsLength,
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
