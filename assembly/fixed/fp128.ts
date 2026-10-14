import { i128 } from '../integer/i128';
import { u128 } from '../integer/u128';
import {
  fixedMul, fixedDiv, fixedSqrt, fixedToString, fixedFromString, fixedFromInt, fixedTrunc,
  setFixedOverflow, getFixedOverflow, fractBitsOf,
} from './core';

// Number of 32-bit digits of the raw value
// @ts-ignore: decorator
@lazy const N = 4;
// @ts-ignore: decorator
@lazy const BITS = 128;

// @ts-ignore: decorator
@inline function ptr(value: i128): usize {
  return changetype<usize>(value);
}

/**
 * Signed fixed point number on 128 bits. `Q` gives the number of fractional bits (a tag
 * type from `types.ts`, or u8 / u16 / u32 / u64), so `fp128<u64>` is a Q63.64 number.
 * The raw value `value` stands for `value / 2^fractBits`.
 *
 * Like the integer types, operations wrap around on overflow (the `safe` version
 * throws). Multiplication, division, conversions and parsing round toward zero.
 * Division by zero throws.
 *
 * Static functions take the tag as a type argument: `fp128.fromString<u64>("1.5")`,
 * `fp128.One<u64>()`.
 */
export class fp128<Q> {

  /** Number of fractional bits */
  @inline
  static fractBits<Q>(): i32 {
    return fractBitsOf<Q>();
  }

  /** Number of integer bits, including the sign bit */
  @inline
  static intBits<Q>(): i32 {
    return BITS - fractBitsOf<Q>();
  }

  @inline static Zero<Q>(): fp128<Q> { return new fp128<Q>(); }
  @inline static One<Q>():  fp128<Q> { return new fp128<Q>(i128.shl(i128.One, fractBitsOf<Q>())); }
  @inline static Min<Q>():  fp128<Q> { return new fp128<Q>(i128.Min); }
  @inline static Max<Q>():  fp128<Q> { return new fp128<Q>(i128.Max); }
  /** Smallest positive value, 2^-fractBits */
  @inline static Epsilon<Q>(): fp128<Q> { return new fp128<Q>(i128.One); }

  /**
   * @param value raw value: the number times 2^fractBits
   */
  constructor(public value: i128 = new i128()) {
    if (fractBitsOf<Q>() < 1 || fractBitsOf<Q>() > BITS - 2) {
      ERROR("fp128<Q>: Q must give between 1 and 126 fractional bits");
    }
  }

  /** Create from the raw value (the number times 2^fractBits) */
  @inline
  static fromRaw<Q>(value: i128): fp128<Q> {
    return new fp128<Q>(value.clone());
  }

  /** Create from an integer */
  static fromI128<Q>(value: i128): fp128<Q> {
    var r = new i128();
    fixedFromInt(ptr(value), N, fractBitsOf<Q>(), ptr(r));
    return new fp128<Q>(r);
  }

  /** Create from an unsigned integer */
  static fromU128<Q>(value: u128): fp128<Q> {
    var r = fp128.fromI128<Q>(value.toI128());
    // 2^127 or more: never fits
    if (value.hi >>> 63) setFixedOverflow(true);
    return r;
  }

  @inline
  static fromI64<Q>(value: i64): fp128<Q> {
    return fp128.fromI128<Q>(i128.fromI64(value));
  }

  @inline
  static fromU64<Q>(value: u64): fp128<Q> {
    return fp128.fromI128<Q>(i128.fromU64(value));
  }

  @inline
  static fromI32<Q>(value: i32): fp128<Q> {
    return fp128.fromI128<Q>(i128.fromI32(value));
  }

  @inline
  static fromU32<Q>(value: u32): fp128<Q> {
    return fp128.fromI128<Q>(i128.fromU32(value));
  }

  /**
   * Create from a float, rounded toward zero. Throws on NaN and infinity.
   */
  static fromF64<Q>(value: f64): fp128<Q> {
    // exact scaling by 2^F
    var scaled = value * reinterpret<f64>(<u64>(fractBitsOf<Q>() + 1023) << 52);
    var limit = reinterpret<f64>(<u64>(BITS - 1 + 1023) << 52); // 2^127
    var r = new fp128<Q>(i128.fromF64(scaled));
    setFixedOverflow(scaled >= limit || scaled < -limit);
    return r;
  }

  @inline
  static fromF32<Q>(value: f32): fp128<Q> {
    return fp128.fromF64<Q>(<f64>value);
  }

  /**
   * Parse a decimal number such as `-12.375` (rounded toward zero)
   */
  static fromString<Q>(value: string): fp128<Q> {
    var r = new i128();
    fixedFromString(value, N, fractBitsOf<Q>(), ptr(r));
    return new fp128<Q>(r);
  }

  @inline
  static from<Q, T>(value: T): fp128<Q> {
         if (value instanceof bool)   return fp128.fromU64<Q>(<u64>value);
    else if (value instanceof i8)     return fp128.fromI64<Q>(<i64>value);
    else if (value instanceof u8)     return fp128.fromU64<Q>(<u64>value);
    else if (value instanceof i16)    return fp128.fromI64<Q>(<i64>value);
    else if (value instanceof u16)    return fp128.fromU64<Q>(<u64>value);
    else if (value instanceof i32)    return fp128.fromI64<Q>(<i64>value);
    else if (value instanceof u32)    return fp128.fromU64<Q>(<u64>value);
    else if (value instanceof i64)    return fp128.fromI64<Q>(<i64>value);
    else if (value instanceof u64)    return fp128.fromU64<Q>(<u64>value);
    else if (value instanceof f32)    return fp128.fromF64<Q>(<f64>value);
    else if (value instanceof f64)    return fp128.fromF64<Q>(<f64>value);
    else if (value instanceof i128)   return fp128.fromI128<Q>(<i128>value);
    else if (value instanceof u128)   return fp128.fromU128<Q>(<u128>value);
    else if (value instanceof String) return fp128.fromString<Q>(<string>value);
    else throw new TypeError("Unsupported generic type");
  }

  /** Number of fractional bits */
  @inline
  get fractBits(): i32 {
    return fractBitsOf<Q>();
  }

  @inline
  isZero(): bool {
    return this.value.isZero();
  }

  @inline
  isNeg(): bool {
    return this.value.isNeg();
  }

  @operator.prefix('!')
  isEmpty(): bool {
    return this.value.isZero();
  }

  @operator.prefix('+')
  pos(): fp128<Q> {
    return this;
  }

  @operator.prefix('-')
  neg(): fp128<Q> {
    var r = new fp128<Q>(this.value.neg());
    setFixedOverflow(i128.eq(this.value, i128.Min));
    return r;
  }

  @operator('+')
  add(b: fp128<Q>): fp128<Q> {
    var a = this.value;
    var r = i128.add(a, b.value);
    setFixedOverflow(a.isNeg() == b.isNeg() && r.isNeg() != a.isNeg());
    return new fp128<Q>(r);
  }

  @operator('-')
  sub(b: fp128<Q>): fp128<Q> {
    var a = this.value;
    var r = i128.sub(a, b.value);
    setFixedOverflow(a.isNeg() != b.isNeg() && r.isNeg() != a.isNeg());
    return new fp128<Q>(r);
  }

  @operator('*')
  mul(b: fp128<Q>): fp128<Q> {
    var r = new i128();
    fixedMul(ptr(this.value), ptr(b.value), N, fractBitsOf<Q>(), ptr(r));
    return new fp128<Q>(r);
  }

  /**
   * Quotient rounded toward zero. Throws on division by zero.
   */
  @operator('/')
  div(b: fp128<Q>): fp128<Q> {
    var r = new i128();
    fixedDiv(ptr(this.value), ptr(b.value), N, fractBitsOf<Q>(), ptr(r));
    return new fp128<Q>(r);
  }

  /**
   * Remainder of the division (exact), with the sign of the dividend.
   * Throws on division by zero.
   */
  @operator('%')
  rem(b: fp128<Q>): fp128<Q> {
    var r = new fp128<Q>(i128.rem(this.value, b.value));
    setFixedOverflow(false);
    return r;
  }

  /**
   * Power with an integer exponent, rounding each multiplication toward zero.
   * Negative exponents give 1 / this^-exponent.
   */
  @operator('**')
  pow(exponent: i32): fp128<Q> {
    var overflow = false;
    var result = fp128.One<Q>();
    var tmp = this.clone();
    var e = exponent < 0 ? -<i64>exponent : <i64>exponent;
    while (e > 0) {
      if (e & 1) {
        result = result.mul(tmp);
        overflow = overflow || getFixedOverflow();
      }
      e >>= 1;
      if (e) {
        tmp = tmp.mul(tmp);
        overflow = overflow || getFixedOverflow();
      }
    }
    if (exponent < 0) {
      result = fp128.One<Q>().div(result);
      overflow = overflow || getFixedOverflow();
    }
    setFixedOverflow(overflow);
    return result;
  }

  @operator('==')
  eq(b: fp128<Q>): bool {
    return i128.eq(this.value, b.value);
  }

  @operator('!=')
  ne(b: fp128<Q>): bool {
    return !i128.eq(this.value, b.value);
  }

  @operator('<')
  lt(b: fp128<Q>): bool {
    return i128.lt(this.value, b.value);
  }

  @operator('>')
  gt(b: fp128<Q>): bool {
    return i128.lt(b.value, this.value);
  }

  @operator('<=')
  le(b: fp128<Q>): bool {
    return !i128.lt(b.value, this.value);
  }

  @operator('>=')
  ge(b: fp128<Q>): bool {
    return !i128.lt(this.value, b.value);
  }

  /** 1 if this > b, -1 if this < b, 0 if equal */
  @inline
  ord(b: fp128<Q>): i32 {
    return i128.ord(this.value, b.value);
  }

  min(b: fp128<Q>): fp128<Q> {
    return i128.lt(b.value, this.value) ? b.clone() : this.clone();
  }

  max(b: fp128<Q>): fp128<Q> {
    return i128.lt(this.value, b.value) ? b.clone() : this.clone();
  }

  /** -1, 0 or 1 */
  @inline
  sign(): i32 {
    return i128.sign(this.value);
  }

  /** Absolute value (wraps for Min) */
  abs(): fp128<Q> {
    if (this.isNeg()) return this.neg();
    setFixedOverflow(false);
    return this.clone();
  }

  /**
   * Square root, rounded down. Throws for negative values.
   */
  sqrt(): fp128<Q> {
    var r = new i128();
    fixedSqrt(ptr(this.value), N, fractBitsOf<Q>(), ptr(r));
    setFixedOverflow(false);
    return new fp128<Q>(r);
  }

  /**
   * `this * b / c` with a full precision intermediate product, rounded toward zero.
   * Throws if `c` is zero or if the result doesn't fit.
   */
  muldiv(b: fp128<Q>, c: fp128<Q>): fp128<Q> {
    // the scale factors cancel out: (x 2^F)(y 2^F) / (z 2^F) = (x y / z) 2^F
    var r = new fp128<Q>(i128.muldiv(this.value, b.value, c.value));
    setFixedOverflow(false);
    return r;
  }

  @inline
  private fractMask(): i128 {
    return i128.sub(i128.shl(i128.One, fractBitsOf<Q>()), i128.One);
  }

  /** Largest integer not greater than the value */
  floor(): fp128<Q> {
    var r = new fp128<Q>(i128.and(this.value, this.fractMask().not()));
    setFixedOverflow(false);
    return r;
  }

  /** Smallest integer not less than the value (wraps near Max) */
  ceil(): fp128<Q> {
    var mask = this.fractMask();
    if (i128.and(this.value, mask).isZero()) {
      setFixedOverflow(false);
      return this.clone();
    }
    var r = i128.add(i128.and(this.value, mask.not()), i128.add(mask, i128.One));
    setFixedOverflow(!this.isNeg() && r.isNeg());
    return new fp128<Q>(r);
  }

  /** Integer part, rounded toward zero */
  trunc(): fp128<Q> {
    return this.isNeg() ? this.ceil() : this.floor();
  }

  /** Nearest integer, halfway cases rounded away from zero (wraps near Min / Max) */
  round(): fp128<Q> {
    var half = i128.shl(i128.One, fractBitsOf<Q>() - 1);
    var neg = this.isNeg();
    var r = neg ? i128.sub(this.value, half) : i128.add(this.value, half);
    var overflow = r.isNeg() != neg;
    var t = new fp128<Q>(r).trunc();
    setFixedOverflow(overflow);
    return t;
  }

  /** Fractional part, with the sign of the value: this - trunc(this) */
  frac(): fp128<Q> {
    var r = new fp128<Q>(i128.sub(this.value, this.trunc().value));
    setFixedOverflow(false);
    return r;
  }

  /** Integer part, rounded toward zero */
  toI128(): i128 {
    var r = new i128();
    fixedTrunc(ptr(this.value), N, fractBitsOf<Q>(), ptr(r));
    return r;
  }

  /** Integer part rounded toward zero, low 64 bits */
  @inline
  toI64(): i64 {
    return this.toI128().toI64();
  }

  /** Integer part rounded toward zero, low 32 bits */
  @inline
  toI32(): i32 {
    return this.toI128().toI32();
  }

  /**
   * Convert to the nearest 64-bit float
   */
  toF64(): f64 {
    // a single rounding, then an exact scaling by 2^-F
    return this.value.toF64() * reinterpret<f64>(<u64>(1023 - fractBitsOf<Q>()) << 52);
  }

  @inline
  toF32(): f32 {
    return <f32>this.toF64();
  }

  clone(): fp128<Q> {
    return new fp128<Q>(this.value.clone());
  }

  /**
   * Decimal representation. By default prints the exact value (the decimal expansion of
   * a binary fraction is finite); with `decimals` >= 0, prints exactly that many
   * fractional digits, truncated toward zero.
   */
  toString(decimals: i32 = -1): string {
    return fixedToString(ptr(this.value), N, fractBitsOf<Q>(), decimals);
  }
}
