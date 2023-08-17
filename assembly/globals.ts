import { u256 } from './integer';
import { u128 } from './integer/u128';

// used for returning quotient and reminder from __divmod128
@lazy export var __divmod_quot_hi: u64 = 0;
@lazy export var __divmod_rem_lo:  u64 = 0;
@lazy export var __divmod_rem_hi:  u64 = 0;
@lazy export var __u256divmod_qot_lo1: u64 = 0;
@lazy export var __u256divmod_qot_lo2: u64 = 0;
@lazy export var __u256divmod_qot_hi1: u64 = 0;
@lazy export var __u256divmod_qot_hi2: u64 = 0;
@lazy export var __u256divmod_rem_lo1: u64 = 0;
@lazy export var __u256divmod_rem_lo2: u64 = 0;
@lazy export var __u256divmod_rem_hi1: u64 = 0;
@lazy export var __u256divmod_rem_hi2: u64 = 0;

// used for returning low and high part of __mulq64, __multi3 etc
@lazy export var __res128_hi: u64 = 0;
// used for returning 0 or 1
@lazy export var __carry: u64 = 0;

/**
 * Convert 128-bit unsigned integer to 64-bit float
 * @param  lo lower  64-bit part of unsigned 128-bit integer
 * @param  hi higher 64-bit part of unsigned 128-bit integer
 * @return    64-bit float result
 */
// @ts-ignore: decorator
@global
export function __floatuntidf(lo: u64, hi: u64): f64 {
  // __floatuntidf ported from LLVM sources
  if (!(lo | hi)) return 0.0;

  var v  = new u128(lo, hi);
  var sd = 128 - __clz128(lo, hi);
  var e  = sd - 1;

  if (sd > 53) {
    if (sd != 55) {
      if (sd == 54) {
        v = u128.shl(v, 1);
      } else {
        v = u128.or(
          u128.shr(v, sd - 55),
          u128.fromBool(u128.and(v, u128.shr(u128.Max, 128 + 55 - sd)).toBool())
        );
      }
    }

    v.lo |= (v.lo & 4) >> 2;
    v.preInc();

    v = u128.shr(v, 2);

    if (v.lo & (1 << 53)) {
      v = u128.shr(v, 1);
      ++e;
    }

  } else {
    v = u128.shl(v, 53 - sd);
  }

  var w: u64 = u128.shr(v, 32).lo & 0x000FFFFF;
  var u: u64 = <u64>(((e + 1023) << 20) | w) << 32;
  return reinterpret<f64>(u | (v.lo & 0xFFFFFFFF));
}

// @ts-ignore: decorator
@global
export function __umulh64(a: u64, b: u64): u64 {
  var u = a & 0xFFFFFFFF; a >>= 32;
  var v = b & 0xFFFFFFFF; b >>= 32;

  var uv = u * v;
  var uv = a * v + (uv >> 32);
  var w0 = u * b + (uv & 0xFFFFFFFF);
  return a * b + (uv >> 32) + (w0 >> 32);
}

// @ts-ignore: decorator
@global
export function __umulq64(a: u64, b: u64): u64 {
  var u = a & 0xFFFFFFFF; a >>= 32;
  var v = b & 0xFFFFFFFF; b >>= 32;

  var uv = u * v;
  var w0 = uv & 0xFFFFFFFF;
  uv = a * v + (uv >> 32);
  var w1 = uv >> 32;
  uv = u * b + (uv & 0xFFFFFFFF);

  __res128_hi = a * b + w1 + (uv >> 32);
  return (uv << 32) | w0;
}

// __umul64Hop computes (hi * 2^64 + lo) = z + (x * y)
// @ts-ignore: decorator
@inline
export function __umul64Hop(z: u64, x: u64, y: u64): u64 {
  var lo = __umulq64(x, y);
  lo = __uadd64(lo, z);
  var hi = __res128_hi +__carry;
  __res128_hi = hi;
  return lo
}

// __umul64Step computes (hi * 2^64 + lo) = z + (x * y) + carry.
// @ts-ignore: decorator
@inline
export function __umul64Step(z: u64, x: u64, y: u64, carry: u64): u64 {
  var lo = __umulq64(x, y)
  lo = __uadd64(lo, carry);
  var hi = __uadd64(__res128_hi, 0, __carry);
  lo = __uadd64(lo, z);
  hi += __carry;
  __res128_hi = hi;
  return lo
}

// __uadd64 returns the sum with carry of x, y and carry: sum = x + y + carry.
// The carry input must be 0 or 1; otherwise the behavior is undefined.
// The carryOut output is guaranteed to be 0 or 1.
// @ts-ignore: decorator
@inline
export function __uadd64(x: u64, y: u64, carry: u64 = 0): u64 {
  var sum = x + y + carry
  // // The sum will overflow if both top bits are set (x & y) or if one of them
  // // is (x | y), and a carry from the lower place happened. If such a carry
  // // happens, the top bit will be 1 + 0 + 1 = 0 (& ~sum).
  __carry = ((x & y) | ((x | y) & ~sum)) >>> 63
  return sum;

}

// Sub returns the difference of x, y and borrow: diff = x - y - borrow.
// The borrow input must be 0 or 1; otherwise the behavior is undefined.
// The borrowOut output is guaranteed to be 0 or 1.
// @ts-ignore: decorator
@inline
export function __usub64(x: u64, y: u64, borrow: u64 = 0): u64 {
  var diff = x - y - borrow
	// The difference will underflow if the top bit of x is not set and the top
	// bit of y is set (^x & y) or if they are the same (^(x ^ y)) and a borrow
	// from the lower place happens. If that borrow happens, the result will be
	// 1 - 1 - 1 = 0 - 0 - 1 = 1 (& diff).
	__carry = ((~x & y) | (~(x ^ y) & diff)) >> 63
	return diff;
}

// u256 * u256 => u256 implemented from https://github.com/holiman/uint256
// @ts-ignore: decorator
@global
export function __mul256(x0: u64, x1: u64, x2: u64, x3: u64, y0: u64, y1: u64, y2: u64, y3: u64): u256 {
  var lo1 = __umulq64(x0, y0);
  var res1 = __umul64Hop(__res128_hi, x1, y0);
  var res2 = __umul64Hop(__res128_hi, x2, y0);
  var res3 = x3 * y0 + __res128_hi;

  var lo2 = __umul64Hop(res1, x0, y1);
  res2 = __umul64Step(res2, x1, y1, __res128_hi);
  res3 += x2 * y1 + __res128_hi;

  var hi1 = __umul64Hop(res2, x0, y2);
  res3 += x1 * y2 + __res128_hi

  var hi2 = __umul64Hop(res3, x0, y3);

  return new u256(lo1, lo2, hi1, hi2);
}

// udivrem2by1 divides <uh, ul> / d and produces both quotient and remainder.
// It uses the provided d's reciprocal.
// Implementation ported from https://github.com/chfast/intx and is based on
// "Improved division by invariant integers", Algorithm 4.
function udivrem2by1(uh: u64, ul: u64, d: u64, reciprocal: u64): u64 {
  let ql = __umulq64(reciprocal, uh);
  ql = __uadd64(__res128_hi, ul, 0);
  __res128_hi = __uadd64(__res128_hi, uh, __carry);
  __res128_hi++;

  let r = ul - __res128_hi*d;

  if (r > ql) {
    __res128_hi--;
    r +=d;
  }

  if (r>=d) {
    __res128_hi++;
    r -=d;
  }
  
  return r;
}

// reciprocal2by1 computes <^d, ^0> / d.
function reciprocal2by1(d: u64): u64 {

  return __udivmod128(~d, ~u64(0), d, 0);
}

// addTo computes x += y.
// Requires len(x) >= len(y).
function addTo(x: u64[], y: u64[]): u64 {
  let carry: u64 = 0;
  for (let i =0; i< y.length; i++){
		x[i], carry = __uadd64(x[i], y[i], carry)
  }
  return carry;
}

// subMulTo computes x -= y * multiplier.
// Requires len(x) >= len(y).
function subMulTo(x: u64[], y: u64[], multiplier: u64): u64 {
  var borrow: u64 = 0;
  for (let i=0; i< y.length; i++){
    var s = __usub64(x[i], borrow, 0)
    borrow = __carry
		var ph = __umulq64(y[i], multiplier);
    var pl = __res128_hi;
		var t  = __usub64(s, pl, 0)
    x[i] = t
		borrow += ph + __carry;
  }
  return borrow;
}

// udivremBy1 divides u by single normalized word d and produces both quotient and remainder.
// The quotient is stored in provided quot.
function udivremBy1(u: u64[], d: u64): u64{
  const reciprocal = reciprocal2by1(d);
  let rem = u[u.length - 1]; // Set the top word as remainder.
  for (let j = u.length - 2; j>=0; j--){
    rem = udivrem2by1(rem, u[j], d, reciprocal)
    switch (j) {
      case 0:
        __u256divmod_qot_lo1 = __res128_hi;
      case 1:
        __u256divmod_qot_lo2 = __res128_hi;
      case 2:
        __u256divmod_qot_hi1 = __res128_hi;
      case 3:
        __u256divmod_qot_hi2 = __res128_hi;
    }
  }
  return rem;
}

// udivremKnuth implements the division of u by normalized multiple word d from the Knuth's division algorithm.
// The quotient is stored in provided quot - len(u)-len(d) words.
// Updates u to contain the remainder - len(d) words.
function udivremKnuth(u: u64[], d: u64[]): u64[] {
  let dh = d[d.length - 1];
  let dl = d.length >= 2 ? d[d.length - 2]: 0;
  const reciprocal = reciprocal2by1(dh);

  for (let j = u.length - d.length - 1; j>=0; j--){
    let u2 = u[j+d.length];
    let u1 = u.length + 1 > j+d.length ? u[j+d.length-1]: 0;
    let u0 = u.length + 2 > j+d.length && j+d.length-2 >= 0 ? u[j+d.length-2]: 0;

    let qhat: u64 =0;
    let rhat: u64 =0;

    if (u2 >= dh) { // Division overflows.
      qhat = ~u64(0);
    }
    else{
      rhat = udivrem2by1(u2, u1, dh, reciprocal);
		  qhat = __res128_hi;
      var ph = __umulq64(qhat, dl);
      var pl = __res128_hi;
			if (ph > rhat || (ph == rhat && pl > u0)) {
				qhat--
			}
    }
  
    // Multiply and subtract.
    const borrow = subMulTo(u.slice(j), d, qhat);
    u[j+d.length] = u2 - borrow;
    if(u2 < borrow) { // Too much subtracted, add back.
      qhat--
      u[j+d.length] += addTo(u.slice(j), d);
    }
    switch (j) {
      case 0:
        __u256divmod_qot_lo1 = qhat;
      case 1:
        __u256divmod_qot_lo2 = qhat;
      case 2:
        __u256divmod_qot_hi1 = qhat;
      case 3:
        __u256divmod_qot_hi2 = qhat;
    }
  }

  return u;
}

// udivrem divides u by d and produces both quotient and remainder.
// The quotient is stored in provided quot - len(u)-len(d)+1 words.
// It loosely follows the Knuth's division algorithm (sometimes referenced as "schoolbook" division) using 64-bit words.
// See Knuth, Volume 2, section 4.3.1, Algorithm D.
// implemented from https://github.com/holiman/uint256
// @ts-ignore: decorator
@global
export function __udivrem(u: u64[], d: u64[]): void {
  let dLen: i32 = 0;
  for (let i: i32 = d.length - 1; i >= 0; i--) {
    if (d[i] != 0) {
      dLen = i + 1;
      break;
    }
  }

  let shift: u64 = clz<u64>(d[dLen-1]);

  let dn = new Array<u64>(dLen);
  for (let i: i32 = dLen - 1; i > 0; i--) {
    dn[i] = (d[i] << shift) | (d[i-1] >> (64 - shift));
  }
  dn[0] = d[0] << shift;

  let uLen: i32 = 0;
  for (let i: i32 = u.length - 1; i >= 0; i--) {
    if (u[i] != 0) {
      uLen = i + 1;
      break;
    }
  }

  if (uLen < dLen) {
    __u256divmod_rem_lo1 = u[0];
    __u256divmod_rem_lo2 = u[1];
    __u256divmod_rem_hi1 = u[2];
    __u256divmod_rem_hi2 = u[3];
    return
  }

  let un = new Array<u64>(uLen+1);
  un[uLen] = u[uLen-1] >> (64 - shift);
  for (let i: i32 = uLen - 1; i > 0; i--) {
    un[i] = (u[i] << shift) | (u[i-1] >> (64 - shift));
  }
  un[0] = u[0] << shift;

  // TODO: Skip the highest word of numerator if not significant.

  if (dLen == 1) {
    let r: u64 = udivremBy1(un, dn[0]);
    let rem: u256 = new u256();
    rem.setU64(r >> shift);
    __u256divmod_rem_lo1 = rem.lo1;
    __u256divmod_rem_lo2 = rem.lo2;
    __u256divmod_rem_hi1 = rem.hi1;
    __u256divmod_rem_hi2 = rem.hi2;
    return
  }

  un = udivremKnuth(un, dn);

  let rem = new Array<u64>(dLen);
  for (let i: i32 = 0; i < dLen-1; i++) {
    rem[i] = (un[i] >> shift) | (un[i+1] << (64 - shift));
  }
  rem[dLen-1] = un[dLen-1] >> shift;
  __u256divmod_rem_lo1 = dLen >= 1 ? rem[0]: 0;
  __u256divmod_rem_lo2 = dLen >= 2 ? rem[1]: 0;
  __u256divmod_rem_hi1 = dLen >= 3 ? rem[2]: 0;
  __u256divmod_rem_hi2 = dLen >= 4 ? rem[3]: 0;
}

export function shl64(x: u256): u256 {
	return new u256(x.lo2, x.hi1, x.hi2, 0)
}

export function shl128(x: u256): u256 {
	return new u256(x.hi1, x.hi2, 0, 0)
}

export function shl192(x: u256): u256 {
	return new u256(x.hi2, 0, 0, 0)
}

export function shr64(x: u256): u256 {
	return new u256(0, x.lo1, x.lo2, x.hi1)
}

export function shr128(x: u256): u256 {
	return new u256(0, 0, x.lo1, x.lo2)
}

export function shr192(x: u256): u256 {
	return new u256(0, 0, 0, x.lo1)
}

// @ts-ignore: decorator
@global
export function __multi3(al: u64, ah: u64, bl: u64, bh: u64): u64 {
  var u = al, v = bl;
  var w: u64, k: u64;

  var u1 = u & 0xFFFFFFFF; u >>= 32;
  var v1 = v & 0xFFFFFFFF; v >>= 32;
  var t  = u1 * v1;
  var w1 = t & 0xFFFFFFFF;

  t = u * v1 + (t >> 32);
  k = t & 0xFFFFFFFF;
  w = t >> 32;
  t = u1 * v + k;

  var lo  = (t << 32) | w1;
  var hi  = u  * v + w;
      hi += ah * bl;
      hi += al * bh;
      hi += t >> 32;

  __res128_hi = hi;
  return lo;
}

// @ts-ignore: decorator
@global
export function __floatuntfdi(value: f64): u64 {
  var u = reinterpret<u64>(value);

  // if (value < -1.7014118346046e38) { // -(2^127-1)
  if (value < reinterpret<f64>(0xC7F0000000000000)) { // -(2^128-1)
    // __float_u128_hi = <u64>-1; // for i128
    __res128_hi = 0;
    // overflow negative
    return 0;
    // } else if (value < -9.2233720368547e18) { // -2^63-1 // for i128
  } else if (value < reinterpret<f64>(0xC3F0000000000000)) { // // -(2^64-1)
    let lo: u64, hi: u64, m: u64;

    m = (u & 0x000FFFFFFFFFFFFF) | (1 << 52);
    u = (u & 0x7FFFFFFFFFFFFFFF) >> 52;

    u -= 1075;
    if (u > 64) {
      lo = 0;
      hi = m << (u - 64);
    } else {
      lo = m << u;
      hi = m >> (64 - u);
    }
    __res128_hi = ~hi;
    return ~lo;
    // } else if (value < 9.2233720368547e18) { // 2^63-1 // for i128
  } else if (value < reinterpret<f64>(0x43F0000000000000)) { // 2^64-1
    // __float_u128_hi = (value < 0) ? -1 : 0; // for int
    __res128_hi = 0;
    // fit in a u64
    return <u64>value;
    // } else if (value < 1.7014118346046e38) {
  } else if (value < reinterpret<f64>(0x47F0000000000000)) { // 2^128-1
    let lo: u64, hi: u64, m: u64;

    m = (u & 0x000FFFFFFFFFFFFF) | (1 << 52);
    u = (u & 0x7FFFFFFFFFFFFFFF) >> 52;
    u -= 1075;
    if (u > 64) {
      lo = 0;
      hi = m << (u - 64);
    } else {
      lo = m << u;
      hi = m >> (64 - u);
    }
    __res128_hi = hi;
    return lo;
  } else {
    // overflow positive
    __res128_hi = <u64>-1; // 0x7FFFFFFFFFFFFFFF for i128
    return <u64>-1;
  }
}

// @ts-ignore: decorator
@global @inline
export function __clz128(lo: u64, hi: u64): i32 {
  var mask: u64 = <i64>(hi ^ (hi - 1)) >> 63;
  return <i32>clz((hi & ~mask) | (lo & mask)) + (<i32>mask & 64);
}

// @ts-ignore: decorator
@global @inline
export function __ctz128(lo: u64, hi: u64): i32 {
  var mask: u64 = <i64>(lo ^ (lo - 1)) >> 63;
  return <i32>ctz((hi & mask) | (lo & ~mask)) + (<i32>mask & 64);
}

// @ts-ignore: decorator
@global
export function __udivmod128(alo: u64, ahi: u64, blo: u64, bhi: u64): u64 {
  var bzn = __clz128(blo, bhi); // N

  // b == 0
  if (bzn == 128) {
    throw new RangeError("Division by zero"); // division by zero
  }

  // var azn = __clz128(alo, ahi); // M
  var btz = __ctz128(blo, bhi); // N

  // a == 0
  if (!(alo | ahi)) {
    __divmod_quot_hi = 0;
    __divmod_rem_lo  = 0;
    __divmod_rem_hi  = 0;
    return 0;
  }

  // a / 1
  if (bzn == 127) {
    __divmod_quot_hi = ahi;
    __divmod_rem_lo  = 0;
    __divmod_rem_hi  = 0;
    return alo;
  }

  // a == b
  if (alo == blo && ahi == bhi) {
    __divmod_quot_hi = 0;
    __divmod_rem_lo  = 0;
    __divmod_rem_hi  = 0;
    return 1;
  }

  // if (btz + bzn == 127) {
  //   // TODO
  //   // __divmod_quot = a >> btz
  //   // b++
  //   // __divmod_rem = a & b
  //   return;
  // }

  if (!(ahi | bhi)) {
    __divmod_quot_hi = 0;
    __divmod_rem_hi  = 0;
    // if `b.lo` is power of two
    if (!(blo & (blo - 1))) {
      __divmod_rem_lo = alo & (blo - 1);
      return alo >> btz;
    } else {
      let dlo = alo / blo;
      __divmod_rem_lo = alo - dlo * blo;
      return dlo;
    }
  }

  // if b.lo == 0 and `b.hi` is power of two
  // if (!blo && !(bhi & (bhi - 1))) {
  //   __divmod_rem = 0;

  //   // TODO

  //   return 0;
  // }

  // var diff: i64 = ahi - bhi;
  // var cmp = <i32>(diff != 0 ? diff : alo - blo); // TODO optimize this

  // if (cmp <= 0) {
  //   __divmod_quot_hi = 0;
  //   __divmod_rem     = 0;
  //   return u64(cmp == 0);
  // }

  // if (bzn - azn <= 5) {
  //   // TODO
  //   // fast path
  //   return __udivmod128core(alo, ahi, blo, bhi);
  // }
  return __udivmod128core(alo, ahi, blo, bhi);
}

function __udivmod128core(alo: u64, ahi: u64, blo: u64, bhi: u64): u64 {
  var a = new u128(alo, ahi);
  var b = new u128(blo, bhi);
  // get leading zeros for left alignment
  var alz = __clz128(alo, ahi);
  var blz = __clz128(blo, bhi);
  var off = blz - alz;
  var nb  = b << off;
  var q = u128.Zero;
  var n = a.clone();

  // create a mask with the length of b
  var mask = u128.One;
  mask <<= 128 - blz;
  --mask;
  mask <<= off;

  var i = 0;
  while (n >= b) {
    ++i;
    q <<= 1;
    if ((n & mask) >= nb) {
      ++q;
      n -= nb;
    }

    mask |= mask >> 1;
    nb >>= 1;
  }
  q <<= (blz - alz - i + 1);

  __divmod_quot_hi = q.hi;
  __divmod_rem_lo  = n.lo;
  __divmod_rem_hi  = n.hi;
  return q.lo;
}

// @ts-ignore: decorator
@global
export function __udivmod128_10(lo: u64, hi: u64): u64 {
  if (!hi) {
    __divmod_quot_hi = 0;
    if (lo < 10) {
      __divmod_rem_lo = 0;
      __divmod_rem_hi = 0;
      return 0;
    } else {
      let qlo = lo / 10;
      __divmod_rem_lo = lo - qlo * 10;
      __divmod_rem_hi = 0;
      return qlo;
    }
  }

  var q: u128, r: u128;
  var n = new u128(lo, hi);

  q  = n >> 1;
  q += n >> 2;
  q += q >> 4;
  q += q >> 8;
  q += q >> 16;
  q += q >> 32;
  q += u128.fromU64(q.hi); // q >> 64
  q >>= 3;
  r = n - (((q << 2) + q) << 1);
  n = q + u128.fromBool(r.lo > 9);

  __divmod_quot_hi = n.hi;
  __divmod_rem_lo  = r.lo;
  __divmod_rem_hi  = r.hi;
  return n.lo;
}
