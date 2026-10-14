import { i128 } from './i128';
import { u128 } from './u128';
import { __mul256, __floatFromWords, __wordsFromFloat } from '../globals';
import {
  bufA, bufB, bufQ, bufR, bufP,
  wordsMul, wordsDivRem, wordsZeroFrom, wordsToString, wordsFromString,
} from '../multiword';

export class u256 {

  @inline static get Zero(): u256 { return new u256(); }
  @inline static get One():  u256 { return new u256(1); }
  @inline static get Min():  u256 { return new u256(); }
  @inline static get Max():  u256 { return new u256(-1, -1, -1, -1); }

  /**
   * Parse a string. Accepts an optional sign and a `0x`, `0o` or `0b` prefix, and stops
   * at the first invalid character. Values that don't fit wrap around (keep the low
   * 256 bits), and a negative value gives its two's complement.
   */
  static fromString(value: string, radix: i32 = 10): u256 {
    wordsFromString(value, radix, bufA, 8);
    return u256.load(bufA);
  }

  @inline
  static fromU256(value: u256): u256 {
    return new u256(value.lo1, value.lo2, value.hi1, value.hi2);
  }

  @inline
  static fromU128(value: u128): u256 {
    return new u256(value.lo, value.hi);
  }

  @inline
  static fromI128(value: i128): u256 {
    var mask = value.hi >> 63;
    return new u256(value.lo, value.hi, mask, mask);
  }

  @inline
  static fromU64(value: u64): u256 {
    return new u256(value);
  }

  @inline
  static fromI64(value: i64): u256 {
    var mask = value >> 63;
    return new u256(value, mask, mask, mask);
  }

  @inline
  static fromU32(value: u32): u256 {
    return new u256(value);
  }

  @inline
  static fromI32(value: i32): u256 {
    var mask: u64 = value >> 31;
    return new u256(<i64>value, mask, mask, mask);
  }

  @inline
  static fromBool(value: bool): u256 {
    return new u256(<u64>value);
  }

  @inline
  static fromBits(
    l0: u32, l1: u32, l2: u32, l3: u32,
    h0: u32, h1: u32, h2: u32, h3: u32,
  ): u256 {
    return new u256(
      <u64>l0 | ((<u64>l1) << 32),
      <u64>l2 | ((<u64>l3) << 32),
      <u64>h0 | ((<u64>h1) << 32),
      <u64>h2 | ((<u64>h3) << 32),
    );
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): u256 {
    // @ts-ignore
    if (array instanceof u8[]) {
      return bigEndian
        // @ts-ignore
        ? u256.fromBytesBE(<u8[]>array)
        // @ts-ignore
        : u256.fromBytesLE(<u8[]>array);
    } else if (array instanceof Uint8Array) {
      return bigEndian
        ? u256.fromUint8ArrayBE(<Uint8Array>array)
        : u256.fromUint8ArrayLE(<Uint8Array>array);
    } else {
      throw new TypeError("Unsupported generic type");
    }
  }

  @inline
  static fromBytesLE(array: u8[]): u256 {
    assert(array.length && (array.length & 31) == 0);
    // @ts-ignore
    var buffer = array.dataStart
    return new u256(
      load<u64>(buffer, 0 * sizeof<u64>()),
      load<u64>(buffer, 1 * sizeof<u64>()),
      load<u64>(buffer, 2 * sizeof<u64>()),
      load<u64>(buffer, 3 * sizeof<u64>()),
    );
  }

  @inline
  static fromBytesBE(array: u8[]): u256 {
    assert(array.length && (array.length & 31) == 0);
    var buffer = array.dataStart;
    return new u256(
      bswap<u64>(load<u64>(buffer, 3 * sizeof<u64>())),
      bswap<u64>(load<u64>(buffer, 2 * sizeof<u64>())),
      bswap<u64>(load<u64>(buffer, 1 * sizeof<u64>())),
      bswap<u64>(load<u64>(buffer, 0 * sizeof<u64>()))
    );
  }

  @inline
  static fromUint8ArrayLE(array: Uint8Array): u256 {
    assert(array.length && (array.length & 31) == 0);
    var buffer = array.dataStart;
    return new u256(
        load<u64>(buffer, 0 * sizeof<u64>()),
        load<u64>(buffer, 1 * sizeof<u64>()),
        load<u64>(buffer, 2 * sizeof<u64>()),
        load<u64>(buffer, 3 * sizeof<u64>())
    );
  }

  @inline
  static fromUint8ArrayBE(array: Uint8Array): u256 {
    assert(array.length && (array.length & 31) == 0);
    var buffer = array.dataStart;
    return new u256(
        bswap<u64>(load<u64>(buffer, 3 * sizeof<u64>())),
        bswap<u64>(load<u64>(buffer, 2 * sizeof<u64>())),
        bswap<u64>(load<u64>(buffer, 1 * sizeof<u64>())),
        bswap<u64>(load<u64>(buffer, 0 * sizeof<u64>()))
    );
  }

  /**
   * Create from a float, truncating toward zero. Negative values give their two's
   * complement, values of 2^256 or more keep their low 256 bits.
   * Throws on NaN and infinity.
   */
  static fromF64(value: f64): u256 {
    __wordsFromFloat(value, bufA, 8);
    return u256.load(bufA);
  }

  @inline
  static fromF32(value: f32): u256 {
    return u256.fromF64(<f64>value);
  }

  /**
   * Create 256-bit unsigned integer from generic type T
   * @param  value
   * @returns 256-bit unsigned integer
   */
  @inline
  static from<T>(value: T): u256 {
         if (value instanceof bool)       return u256.fromU64(<u64>value);
    else if (value instanceof i8)         return u256.fromI64(<i64>value);
    else if (value instanceof u8)         return u256.fromU64(<u64>value);
    else if (value instanceof i16)        return u256.fromI64(<i64>value);
    else if (value instanceof u16)        return u256.fromU64(<u64>value);
    else if (value instanceof i32)        return u256.fromI64(<i64>value);
    else if (value instanceof u32)        return u256.fromU64(<u64>value);
    else if (value instanceof i64)        return u256.fromI64(<i64>value);
    else if (value instanceof u64)        return u256.fromU64(<u64>value);
    else if (value instanceof f32)        return u256.fromF64(<f64>value);
    else if (value instanceof f64)        return u256.fromF64(<f64>value);
    else if (value instanceof i128)       return u256.fromI128(<i128>value);
    else if (value instanceof u128)       return u256.fromU128(<u128>value);
    else if (value instanceof u256)       return u256.fromU256(<u256>value);
    else if (value instanceof u8[])       return u256.fromBytes(<u8[]>value);
    else if (value instanceof Uint8Array) return u256.fromBytes(<Uint8Array>value);
    else if (value instanceof String)     return u256.fromString(<string>value);
    else throw new TypeError("Unsupported generic type");
  }

  constructor(
    public lo1: u64 = 0,
    public lo2: u64 = 0,
    public hi1: u64 = 0,
    public hi2: u64 = 0,
  ) {}

  @inline
  set(value: u256): this {
    this.lo1 = value.lo1;
    this.lo2 = value.lo2;
    this.hi1 = value.hi1;
    this.hi2 = value.hi2;
    return this;
  }

  @inline
  setU128(value: u128): this {
    this.lo1 = value.lo;
    this.lo2 = value.hi;
    this.hi1 = 0;
    this.hi2 = 0;
    return this;
  }

  @inline
  setI64(value: i64): this {
    var mask: u64 = value >> 63;
    this.lo1 = value;
    this.lo2 = mask;
    this.hi1 = mask;
    this.hi2 = mask;
    return this;
  }

  @inline
  setU64(value: u64): this {
    this.lo1 = value;
    this.lo2 = 0;
    this.hi1 = 0;
    this.hi2 = 0;
    return this;
  }

  @inline
  setI32(value: i32): this {
    var mask: u64 = value >> 31;
    this.lo1 = <i64>value;
    this.lo2 = mask;
    this.hi1 = mask;
    this.hi2 = mask;
    return this;
  }

  @inline
  setU32(value: u32): this {
    this.lo1 = value;
    this.lo2 = 0;
    this.hi1 = 0;
    this.hi2 = 0;
    return this;
  }

  @inline
  isZero(): bool {
    return !(this.lo1 | this.lo2 | this.hi1 | this.hi2);
  }

  @inline @operator.prefix('!')
  static isEmpty(value: u256): bool {
    return value.isZero();
  }

  @operator.prefix('~')
  not(): u256 {
    return new u256(~this.lo1, ~this.lo2, ~this.hi1, ~this.hi2);
  }

  @operator.prefix('+')
  pos(): u256 {
    return this;
  }

  @operator.prefix('-')
  neg(): u256 {
    return u256.sub(u256.Zero, this);
  }

  @operator.prefix('++')
  preInc(): this {
    var lo1 = this.lo1 + 1;
    var c   = u64(lo1 == 0);
    var lo2 = this.lo2 + c;
        c  &= u64(lo2 == 0);
    var hi1 = this.hi1 + c;
        c  &= u64(hi1 == 0);
    this.lo1 = lo1;
    this.lo2 = lo2;
    this.hi1 = hi1;
    this.hi2 += c;
    return this;
  }

  @operator.prefix('--')
  preDec(): this {
    var b   = u64(this.lo1 == 0);
    var lo2 = this.lo2;
    var hi1 = this.hi1;
    this.lo1 -= 1;
    this.lo2  = lo2 - b;
        b    &= u64(lo2 == 0);
    this.hi1  = hi1 - b;
        b    &= u64(hi1 == 0);
    this.hi2 -= b;
    return this;
  }

  @operator.postfix('++')
  postInc(): u256 {
    return this.clone().preInc();
  }

  @operator.postfix('--')
  postDec(): u256 {
    return this.clone().preDec();
  }

  @operator('+')
  static add(a: u256, b: u256): u256 {
    var lo1 = a.lo1 + b.lo1;
    var cy  = u64(lo1 < a.lo1);
    var t   = a.lo2 + cy;
        cy  = u64(t < cy);
    var lo2 = t + b.lo2;
        cy |= u64(lo2 < t);
        t   = a.hi1 + cy;
        cy  = u64(t < cy);
    var hi1 = t + b.hi1;
        cy |= u64(hi1 < t);
    var hi2 = a.hi2 + b.hi2 + cy;
    return new u256(lo1, lo2, hi1, hi2);
  }

  @operator('-')
  static sub(a: u256, b: u256): u256 {
    var lo1 = a.lo1 - b.lo1;
    var bw  = u64(a.lo1 < b.lo1);
    var t   = a.lo2 - b.lo2;
    var bw2 = u64(a.lo2 < b.lo2) | u64(t < bw);
    var lo2 = t - bw;
        t   = a.hi1 - b.hi1;
        bw  = u64(a.hi1 < b.hi1) | u64(t < bw2);
    var hi1 = t - bw2;
    var hi2 = a.hi2 - b.hi2 - bw;
    return new u256(lo1, lo2, hi1, hi2);
  }

  @inline @operator('|')
  static or(a: u256, b: u256): u256 {
    return new u256(a.lo1 | b.lo1, a.lo2 | b.lo2, a.hi1 | b.hi1, a.hi2 | b.hi2);
  }

  @inline @operator('^')
  static xor(a: u256, b: u256): u256 {
    return new u256(a.lo1 ^ b.lo1, a.lo2 ^ b.lo2, a.hi1 ^ b.hi1, a.hi2 ^ b.hi2);
  }

  @inline @operator('&')
  static and(a: u256, b: u256): u256 {
    return new u256(a.lo1 & b.lo1, a.lo2 & b.lo2, a.hi1 & b.hi1, a.hi2 & b.hi2);
  }

  /**
   * Shift left. Like Solidity, shifting by 256 bits or more (or by a negative amount)
   * gives zero.
   */
  @operator('<<')
  static shl(value: u256, shift: i32): u256 {
    if (<u32>shift >= 256) return u256.Zero;
    var a0 = value.lo1, a1 = value.lo2, a2 = value.hi1, a3 = value.hi2;
    switch (shift >> 6) {
      case 1: { a3 = a2; a2 = a1; a1 = a0; a0 = 0; break; }
      case 2: { a3 = a1; a2 = a0; a1 = 0;  a0 = 0; break; }
      case 3: { a3 = a0; a2 = 0;  a1 = 0;  a0 = 0; break; }
    }
    var s = <u64>(shift & 63);
    if (s) {
      a3 = (a3 << s) | (a2 >> (64 - s));
      a2 = (a2 << s) | (a1 >> (64 - s));
      a1 = (a1 << s) | (a0 >> (64 - s));
      a0 =  a0 << s;
    }
    return new u256(a0, a1, a2, a3);
  }

  /**
   * Logical shift right. Shifting by 256 bits or more (or by a negative amount)
   * gives zero.
   */
  @operator('>>')
  static shr(value: u256, shift: i32): u256 {
    if (<u32>shift >= 256) return u256.Zero;
    var a0 = value.lo1, a1 = value.lo2, a2 = value.hi1, a3 = value.hi2;
    switch (shift >> 6) {
      case 1: { a0 = a1; a1 = a2; a2 = a3; a3 = 0; break; }
      case 2: { a0 = a2; a1 = a3; a2 = 0;  a3 = 0; break; }
      case 3: { a0 = a3; a1 = 0;  a2 = 0;  a3 = 0; break; }
    }
    var s = <u64>(shift & 63);
    if (s) {
      a0 = (a0 >> s) | (a1 << (64 - s));
      a1 = (a1 >> s) | (a2 << (64 - s));
      a2 = (a2 >> s) | (a3 << (64 - s));
      a3 =  a3 >> s;
    }
    return new u256(a0, a1, a2, a3);
  }

  @inline @operator('>>>')
  static shr_u(value: u256, shift: i32): u256 {
    return u256.shr(value, shift);
  }

  @inline
  static rotl(value: u256, shift: i32): u256 {
    var n = shift & 255;
    if (n == 0) return value.clone();
    return u256.or(u256.shl(value, n), u256.shr(value, 256 - n));
  }

  @inline
  static rotr(value: u256, shift: i32): u256 {
    var n = shift & 255;
    if (n == 0) return value.clone();
    return u256.or(u256.shr(value, n), u256.shl(value, 256 - n));
  }

  @inline @operator('==')
  static eq(a: u256, b: u256): bool {
    return (
      a.lo1 == b.lo1 && a.lo2 == b.lo2 &&
      a.hi1 == b.hi1 && a.hi2 == b.hi2
    );
  }

  @inline @operator('!=')
  static ne(a: u256, b: u256): bool {
    return !u256.eq(a, b);
  }

  @operator('<')
  static lt(a: u256, b: u256): bool {
    var ah2 = a.hi2, bh2 = b.hi2;
    if (ah2 != bh2) return ah2 < bh2;
    var ah1 = a.hi1, bh1 = b.hi1;
    if (ah1 != bh1) return ah1 < bh1;
    var al2 = a.lo2, bl2 = b.lo2;
    if (al2 != bl2) return al2 < bl2;
    return a.lo1 < b.lo1;
  }

  @inline @operator('>')
  static gt(a: u256, b: u256): bool {
    return u256.lt(b, a);
  }

  @inline @operator('<=')
  static le(a: u256, b: u256): bool {
    return !u256.lt(b, a);
  }

  @inline @operator('>=')
  static ge(a: u256, b: u256): bool {
    return !u256.lt(a, b);
  }

  /**
   * Get ordering
   * if a > b then result is  1
   * if a < b then result is -1
   * if a = b then result is  0
   */
  @inline
  static ord(a: u256, b: u256): i32 {
    return i32(u256.lt(b, a)) - i32(u256.lt(a, b));
  }

  @inline
  static min(a: u256, b: u256): u256 {
    return u256.lt(b, a) ? b.clone() : a.clone();
  }

  @inline
  static max(a: u256, b: u256): u256 {
    return u256.lt(a, b) ? b.clone() : a.clone();
  }

  // mul: u256 x u256 = u256 (low 256 bits of the product)
  @inline @operator('*')
  static mul(a: u256, b: u256): u256 {
    return __mul256(a.lo1, a.lo2, a.hi1, a.hi2, b.lo1, b.lo2, b.hi1, b.hi2);
  }

  /**
   * Full 512-bit product of `a` and `b` into `bufP` (16 digits).
   * Returns true if the product doesn't fit in 256 bits.
   */
  static mulFull(a: u256, b: u256): bool {
    a.store(bufA);
    b.store(bufB);
    wordsMul(bufA, 8, bufB, 8, bufP);
    return !wordsZeroFrom(bufP, 8, 16);
  }

  /**
   * Quotient, rounded down. Throws on division by zero.
   */
  @operator('/')
  static div(a: u256, b: u256): u256 {
    if ((b.lo2 | b.hi1 | b.hi2) == 0 && (a.lo2 | a.hi1 | a.hi2) == 0) {
      let d = b.lo1;
      if (d == 0) throw new RangeError("Division by zero");
      return new u256(a.lo1 / d);
    }
    u256.divRemInto(a, b);
    return u256.load(bufQ);
  }

  /**
   * Remainder of the division. Throws on division by zero.
   */
  @operator('%')
  static rem(a: u256, b: u256): u256 {
    if ((b.lo2 | b.hi1 | b.hi2) == 0 && (a.lo2 | a.hi1 | a.hi2) == 0) {
      let d = b.lo1;
      if (d == 0) throw new RangeError("Division by zero");
      return new u256(a.lo1 % d);
    }
    u256.divRemInto(a, b);
    return u256.load(bufR);
  }

  @inline
  static mod(a: u256, b: u256): u256 {
    return u256.rem(a, b);
  }

  // quotient into bufQ, remainder into bufR
  @inline
  private static divRemInto(a: u256, b: u256): void {
    a.store(bufA);
    b.store(bufB);
    wordsDivRem(bufA, 8, bufB, 8, bufQ, bufR);
  }

  /**
   * Calculate `a * b / c` rounded down, with a full precision (512-bit) intermediate
   * product, like OpenZeppelin's `Math.mulDiv`.
   * Throws if `c` is zero or if the result doesn't fit in 256 bits.
   */
  static muldiv(a: u256, b: u256, c: u256): u256 {
    if (c.isZero()) throw new RangeError("Division by zero");
    u256.mulFull(a, b);
    c.store(bufB);
    wordsDivRem(bufP, 16, bufB, 8, bufQ, bufR);
    if (!wordsZeroFrom(bufQ, 8, 16)) throw new RangeError("Overflow in muldiv");
    return u256.load(bufQ);
  }

  /**
   * Same as `muldiv`, rounded up.
   */
  static muldivUp(a: u256, b: u256, c: u256): u256 {
    var q = u256.muldiv(a, b, c);
    if (!wordsZeroFrom(bufR, 0, 8)) {
      if (q == u256.Max) throw new RangeError("Overflow in muldiv");
      q.preInc();
    }
    return q;
  }

  /**
   * `(a * b) % c` computed with a full precision product, like Solidity's `mulmod`.
   * Throws if `c` is zero.
   */
  static mulmod(a: u256, b: u256, c: u256): u256 {
    if (c.isZero()) throw new RangeError("Division by zero");
    u256.mulFull(a, b);
    c.store(bufB);
    wordsDivRem(bufP, 16, bufB, 8, bufQ, bufR);
    return u256.load(bufR);
  }

  /**
   * `(a + b) % c` computed without overflow, like Solidity's `addmod`.
   * Throws if `c` is zero.
   */
  static addmod(a: u256, b: u256, c: u256): u256 {
    if (c.isZero()) throw new RangeError("Division by zero");
    var sum = u256.add(a, b);
    var carry = u256.lt(sum, a);
    sum.store(bufP);
    store<u64>(bufP, <u64>carry, 32);
    c.store(bufB);
    wordsDivRem(bufP, 10, bufB, 8, bufQ, bufR);
    return u256.load(bufR);
  }

  /**
   * Calculate power of base with exponent (wrapping on overflow).
   * Negative exponents give zero (or one if `base` is one).
   */
  @operator('**')
  static pow(base: u256, exponent: i32): u256 {
    var result = u256.One;
    if (u256.eq(base, result)) return result;
    if (exponent < 0) return u256.Zero;
    var tmp = base.clone();
    while (exponent > 0) {
      if (exponent & 1) result = u256.mul(result, tmp);
      exponent >>= 1;
      if (exponent) tmp = u256.mul(tmp, tmp);
    }
    return result;
  }

  @inline
  static sqr(value: u256): u256 {
    return u256.mul(value, value);
  }

  /**
   * Integer square root, rounded down.
   */
  static sqrt(value: u256): u256 {
    if (u256.lt(value, new u256(2))) return value.clone();
    // start from a power of two not smaller than the root, then Newton's method
    // decreases monotonically to floor(sqrt(value))
    var bits = 256 - u256.clz(value);
    var x = u256.shl(u256.One, (bits + 1) >> 1);
    while (true) {
      let y = u256.shr(u256.add(x, u256.div(value, x)), 1);
      if (!u256.lt(y, x)) return x;
      x = y;
    }
    return x;
  }

  @inline
  static popcnt(value: u256): i32 {
    return <i32>(
      popcnt(value.lo1) + popcnt(value.lo2) +
      popcnt(value.hi1) + popcnt(value.hi2)
    );
  }

  /**
   * Count of leading zero bits (256 for zero)
   */
  @inline
  static clz(value: u256): i32 {
         if (value.hi2) return <i32>clz(value.hi2);
    else if (value.hi1) return <i32>clz(value.hi1) + 64;
    else if (value.lo2) return <i32>clz(value.lo2) + 128;
    else                return <i32>clz(value.lo1) + 192;
  }

  /**
   * Count of trailing zero bits (256 for zero)
   */
  @inline
  static ctz(value: u256): i32 {
         if (value.lo1) return <i32>ctz(value.lo1);
    else if (value.lo2) return <i32>ctz(value.lo2) + 64;
    else if (value.hi1) return <i32>ctz(value.hi1) + 128;
    else                return <i32>ctz(value.hi2) + 192;
  }

  /** Store the four 64-bit parts at `ptr` (little-endian, 32 bytes) */
  @inline
  store(ptr: usize): void {
    store<u64>(ptr, this.lo1, 0);
    store<u64>(ptr, this.lo2, 8);
    store<u64>(ptr, this.hi1, 16);
    store<u64>(ptr, this.hi2, 24);
  }

  /** Load from `ptr` (little-endian, 32 bytes) */
  @inline
  static load(ptr: usize): u256 {
    return new u256(
      load<u64>(ptr, 0),
      load<u64>(ptr, 8),
      load<u64>(ptr, 16),
      load<u64>(ptr, 24),
    );
  }

  /**
   * Convert to 256-bit unsigned integer
   * @returns 256-bit unsigned integer
   */
  @inline
  toU256(): this {
    return this;
  }

  /**
   * Convert to 128-bit signed integer (low 128 bits)
   * @return 128-bit signed integer
   */
  @inline
  toI128(): i128 {
    return new i128(this.lo1, this.lo2);
  }

  /**
   * Convert to 128-bit unsigned integer (low 128 bits)
   * @return 128-bit unsigned integer
   */
  @inline
  toU128(): u128 {
    return new u128(this.lo1, this.lo2);
  }

  /**
   * Convert to 64-bit signed integer (low 64 bits)
   * @return 64-bit signed integer
   */
  @inline
  toI64(): i64 {
    return <i64>this.lo1;
  }

  /**
   * Convert to 64-bit unsigned integer (low 64 bits)
   * @return 64-bit unsigned integer
   */
  @inline
  toU64(): u64 {
    return this.lo1;
  }

  /**
   * Convert to 32-bit signed integer (low 32 bits)
   * @return 32-bit signed integer
   */
  @inline
  toI32(): i32 {
    return <i32>this.lo1;
  }

  /**
   * Convert to 32-bit unsigned integer (low 32 bits)
   * @return 32-bit unsigned integer
   */
  @inline
  toU32(): u32 {
    return <u32>this.lo1;
  }

  /**
   * Convert to 1-bit boolean
   * @return 1-bit boolean
   */
  @inline
  toBool(): bool {
    return <bool>(this.lo1 | this.lo2 | this.hi1 | this.hi2);
  }

  /**
   * Convert to 64-bit float, rounded to nearest (ties to even)
   * @returns 64-bit float
   */
  toF64(): f64 {
    this.store(bufA);
    return __floatFromWords(bufA, 8);
  }

  /**
   * Convert to 32-bit float
   * @returns 32-bit float
   */
  @inline
  toF32(): f32 {
    return <f32>this.toF64();
  }

  @inline
  private toArrayBufferLE(buffer: usize): void {
    store<u64>(buffer, this.lo1, 0 * sizeof<u64>());
    store<u64>(buffer, this.lo2, 1 * sizeof<u64>());
    store<u64>(buffer, this.hi1, 2 * sizeof<u64>());
    store<u64>(buffer, this.hi2, 3 * sizeof<u64>());
  }

  @inline
  private toArrayBufferBE(buffer: usize): void {
    store<u64>(buffer, bswap(this.hi2), 0 * sizeof<u64>());
    store<u64>(buffer, bswap(this.hi1), 1 * sizeof<u64>());
    store<u64>(buffer, bswap(this.lo2), 2 * sizeof<u64>());
    store<u64>(buffer, bswap(this.lo1), 3 * sizeof<u64>());
  }

  @inline
  private toArrayBuffer(buffer: usize, bigEndian: bool = false): void {
    if (bigEndian) {
      this.toArrayBufferBE(buffer);
    } else {
      this.toArrayBufferLE(buffer);
    }
  }

  /**
   * Convert to generic type `T`. Useful inside other generics methods
   * @param  T  is <bool | i8 | u8 | i16 | u16 | i32 | u32 | i64 | u64 | f32 | f64 | i128 | u128 | i256 | u256 | u8[] | Uint8Array | `StaticArray<u8>` | string>
   * @returns   type of `T`
   */
  @inline
  as<T>(): T {
    if (isBoolean<T>()) {
      return <T>this.toBool();
    } else if (isInteger<T>()) {
      if (isSigned<T>()) {
        return <T>this.toI64();
      } else {
        return <T>this.toU64();
      }
    } else if (isFloat<T>()) {
      return <T>this.toF64();
    } else if (isString<T>()) {
      return <T>this.toString();
    } else if (isReference<T>()) {
      let dummy = changetype<T>(0);
           if (dummy instanceof u8[])            return <T>this.toBytes();
      else if (dummy instanceof StaticArray<u8>) return <T>this.toStaticBytes();
      else if (dummy instanceof Uint8Array)      return <T>this.toUint8Array();
      else if (dummy instanceof i128)            return <T>this.toI128();
      else if (dummy instanceof u128)            return <T>this.toU128();
      else if (dummy instanceof u256)            return <T>this;
      else throw new TypeError('Unsupported generic type');
    } else throw new TypeError('Unsupported generic type');
  }

  /**
   * Convert to byte array
   * @param bigEndian Little or Big Endian? Default: false
   * @returns  Array of bytes
   */
  @inline
  toBytes(bigEndian: bool = false): u8[] {
    var result = new Array<u8>(32);
    this.toArrayBuffer(result.dataStart, bigEndian);
    return result;
  }

  /**
   * Convert to byte static array
   * @param bigEndian Little or Big Endian? Default: false
   * @returns  StaticArray of bytes
   */
  @inline
  toStaticBytes(bigEndian: bool = false): StaticArray<u8> {
    var result = new StaticArray<u8>(32);
    this.toArrayBuffer(changetype<usize>(result), bigEndian);
    return result;
  }

  /**
   * Convert to Uint8Array
   * @param bigEndian Little or Big Endian? Default: false
   * @returns  Uint8Array
   */
  @inline
  toUint8Array(bigEndian: bool = false): Uint8Array {
    var result = new Uint8Array(32);
    this.toArrayBuffer(result.dataStart, bigEndian);
    return result;
  }

  clone(): u256 {
    return new u256(this.lo1, this.lo2, this.hi1, this.hi2);
  }

  /**
   * Format in base `radix` (2 to 36), lowercase, without prefix
   */
  toString(radix: i32 = 10): string {
    this.store(bufA);
    return wordsToString(bufA, 8, radix);
  }
}
