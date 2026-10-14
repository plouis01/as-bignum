// Arithmetic on little-endian arrays of 32-bit digits stored in linear memory.
//
// Shared by u128, u256 and their signed and fixed point versions: a u128 is 4 digits,
// a u256 is 8 digits, the full product of two u256 is 16 digits. Since WebAssembly is
// little-endian, the `lo, hi` / `lo1, lo2, hi1, hi2` u64 fields of a number can be
// stored as-is and read back as 32-bit digits.
//
// Intermediate values live in static scratch buffers, so these helpers are not
// reentrant (which is fine: they never call back into user code).

// @ts-ignore: decorator
@lazy export const MAX_WORDS = 16; // 512 bits

// @ts-ignore: decorator
@lazy const scratchU  = memory.data((MAX_WORDS + 1) << 2, 8); // normalized dividend
// @ts-ignore: decorator
@lazy const scratchV  = memory.data(MAX_WORDS << 2, 8);       // normalized divisor

// public scratch buffers for callers: operands, quotient, remainder, product
// @ts-ignore: decorator
@lazy export const bufA = memory.data(MAX_WORDS << 2, 8);
// @ts-ignore: decorator
@lazy export const bufB = memory.data(MAX_WORDS << 2, 8);
// @ts-ignore: decorator
@lazy export const bufQ = memory.data(MAX_WORDS << 2, 8);
// @ts-ignore: decorator
@lazy export const bufR = memory.data(MAX_WORDS << 2, 8);
// @ts-ignore: decorator
@lazy export const bufP = memory.data(MAX_WORDS << 2, 8);

// @ts-ignore: decorator
@inline function getW(ptr: usize, i: i32): u32 {
  return load<u32>(ptr + (<usize>i << 2));
}

// @ts-ignore: decorator
@inline function setW(ptr: usize, i: i32, value: u32): void {
  store<u32>(ptr + (<usize>i << 2), value);
}

/** Number of significant digits of `ptr[0..n)` (0 for zero). */
export function wordsLength(ptr: usize, n: i32): i32 {
  while (n > 0 && getW(ptr, n - 1) == 0) --n;
  return n;
}

/** ptr[0..n) = 0 */
// @ts-ignore: decorator
@inline export function wordsClear(ptr: usize, n: i32): void {
  memory.fill(ptr, 0, <usize>n << 2);
}

/** Is `ptr[from..n)` all zero? */
export function wordsZeroFrom(ptr: usize, from: i32, n: i32): bool {
  for (let i = from; i < n; ++i) {
    if (getW(ptr, i) != 0) return false;
  }
  return true;
}

/**
 * w[0..m+n) = a[0..m) * b[0..n)
 * `w` must not overlap `a` or `b`.
 */
export function wordsMul(a: usize, m: i32, b: usize, n: i32, w: usize): void {
  wordsClear(w, m + n);
  for (let j = 0; j < n; ++j) {
    let bj = <u64>getW(b, j);
    if (bj == 0) continue;
    let k: u64 = 0;
    for (let i = 0; i < m; ++i) {
      let t = <u64>getW(a, i) * bj + <u64>getW(w, i + j) + k;
      setW(w, i + j, <u32>t);
      k = t >> 32;
    }
    setW(w, j + m, <u32>k);
  }
}

/**
 * Divide `u[0..m)` by `v[0..n)` and store the quotient in `q[0..m)` and the remainder
 * in `r[0..n)`. Leading zero digits are allowed in both operands.
 * Throws on division by zero.
 *
 * Knuth's Algorithm D (The Art of Computer Programming, vol. 2, 4.3.1) with 32-bit
 * digits, following `divmnu64` from Hacker's Delight, 2nd edition, 9-2.
 */
export function wordsDivRem(u: usize, m: i32, v: usize, n: i32, q: usize, r: usize): void {
  var nn = wordsLength(v, n);
  if (nn == 0) throw new RangeError("Division by zero");
  var mm = wordsLength(u, m);

  wordsClear(q, m);
  wordsClear(r, n);

  if (mm < nn) {
    // dividend smaller than divisor
    memory.copy(r, u, <usize>mm << 2);
    return;
  }

  if (nn == 1) {
    // single digit divisor
    let d = <u64>getW(v, 0);
    let k: u64 = 0;
    for (let j = mm - 1; j >= 0; --j) {
      let t = (k << 32) | <u64>getW(u, j);
      let qj = t / d;
      setW(q, j, <u32>qj);
      k = t - qj * d;
    }
    setW(r, 0, <u32>k);
    return;
  }

  // normalize: shift the divisor left so that its top bit is set
  var s = <u32>clz(getW(v, nn - 1));
  var vn = scratchV;
  var un = scratchU;
  for (let i = nn - 1; i > 0; --i) {
    setW(vn, i, (getW(v, i) << s) | <u32>(<u64>getW(v, i - 1) >> (32 - s)));
  }
  setW(vn, 0, getW(v, 0) << s);

  setW(un, mm, <u32>(<u64>getW(u, mm - 1) >> (32 - s)));
  for (let i = mm - 1; i > 0; --i) {
    setW(un, i, (getW(u, i) << s) | <u32>(<u64>getW(u, i - 1) >> (32 - s)));
  }
  setW(un, 0, getW(u, 0) << s);

  const b: u64 = 0x100000000;
  var vtop  = <u64>getW(vn, nn - 1);
  var vnext = <u64>getW(vn, nn - 2);

  for (let j = mm - nn; j >= 0; --j) {
    // estimate the quotient digit
    let num  = (<u64>getW(un, j + nn) << 32) | <u64>getW(un, j + nn - 1);
    let qhat = num / vtop;
    let rhat = num - qhat * vtop;
    while (qhat >= b || qhat * vnext > ((rhat << 32) | <u64>getW(un, j + nn - 2))) {
      --qhat;
      rhat += vtop;
      if (rhat >= b) break;
    }

    // multiply and subtract
    let k: i64 = 0;
    let t: i64 = 0;
    for (let i = 0; i < nn; ++i) {
      let p = qhat * <u64>getW(vn, i);
      t = <i64>getW(un, i + j) - k - <i64>(p & 0xFFFFFFFF);
      setW(un, i + j, <u32>t);
      k = <i64>(p >> 32) - (t >> 32);
    }
    t = <i64>getW(un, j + nn) - k;
    setW(un, j + nn, <u32>t);

    if (t < 0) {
      // subtracted too much: add back
      --qhat;
      let c: u64 = 0;
      for (let i = 0; i < nn; ++i) {
        let sum = <u64>getW(un, i + j) + <u64>getW(vn, i) + c;
        setW(un, i + j, <u32>sum);
        c = sum >> 32;
      }
      setW(un, j + nn, getW(un, j + nn) + <u32>c);
    }
    setW(q, j, <u32>qhat);
  }

  // denormalize the remainder
  for (let i = 0; i < nn - 1; ++i) {
    setW(r, i, (getW(un, i) >> s) | <u32>(<u64>getW(un, i + 1) << (32 - s)));
  }
  setW(r, nn - 1, getW(un, nn - 1) >> s);
}

/** ptr[0..n) = -ptr[0..n) (two's complement, in place) */
export function wordsNeg(ptr: usize, n: i32): void {
  var c: u64 = 1;
  for (let i = 0; i < n; ++i) {
    let t = <u64>(~getW(ptr, i)) + c;
    setW(ptr, i, <u32>t);
    c = t >> 32;
  }
}
