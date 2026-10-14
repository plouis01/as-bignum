import { i128 } from './i128';
import { u128 } from './u128';
import { u256 } from './u256';
import { __floatFromWords, __wordsFromFloat } from '../globals';
import { bufA, wordsToString, wordsFromString } from '../multiword';

// Signed operations reuse the unsigned ones: in two's complement, addition, subtraction,
// multiplication and the bitwise operations give the same bits for signed and unsigned
// numbers. `asU` reads an i256 as an u256 (same memory layout) without copying.

// @ts-ignore: decorator
@inline function asU(value: i256): u256 {
  return changetype<u256>(value);
}

// @ts-ignore: decorator
@inline function fromU(value: u256): i256 {
  return new i256(value.lo1, value.lo2, value.hi1, value.hi2);
}

export class i256 {

  @inline static get Zero(): i256 { return new i256(); }
  @inline static get One():  i256 { return new i256(1); }
  @inline static get NegOne(): i256 { return new i256(-1, -1, -1, -1); }
  @inline static get Min():  i256 { return new i256(0, 0, 0, 0x8000000000000000); }
  @inline static get Max():  i256 { return new i256(-1, -1, -1, 0x7FFFFFFFFFFFFFFF); }

  /**
   * Parse a string. Accepts an optional sign and a `0x`, `0o` or `0b` prefix, and stops
   * at the first invalid character. Values that don't fit wrap around.
   */
  static fromString(value: string, radix: i32 = 10): i256 {
    wordsFromString(value, radix, bufA, 8);
    return fromU(u256.load(bufA));
  }

  @inline
  static fromI256(value: i256): i256 {
    return new i256(value.lo1, value.lo2, value.hi1, value.hi2);
  }

  @inline
  static fromU256(value: u256): i256 {
    return new i256(value.lo1, value.lo2, value.hi1, value.hi2);
  }

  @inline
  static fromI128(value: i128): i256 {
    var mask = value.hi >> 63;
    return new i256(value.lo, value.hi, mask, mask);
  }

  @inline
  static fromU128(value: u128): i256 {
    return new i256(value.lo, value.hi);
  }

  @inline
  static fromI64(value: i64): i256 {
    var mask = value >> 63;
    return new i256(value, mask, mask, mask);
  }

  @inline
  static fromU64(value: u64): i256 {
    return new i256(value);
  }

  @inline
  static fromI32(value: i32): i256 {
    return i256.fromI64(<i64>value);
  }

  @inline
  static fromU32(value: u32): i256 {
    return new i256(<u64>value);
  }

  @inline
  static fromBool(value: bool): i256 {
    return new i256(<u64>value);
  }

  /**
   * Create from a float, truncating toward zero. Values out of range keep their low
   * 256 bits. Throws on NaN and infinity.
   */
  static fromF64(value: f64): i256 {
    __wordsFromFloat(value, bufA, 8);
    return fromU(u256.load(bufA));
  }

  @inline
  static fromF32(value: f32): i256 {
    return i256.fromF64(<f64>value);
  }

  @inline
  static fromBits(
    l0: u32, l1: u32, l2: u32, l3: u32,
    h0: u32, h1: u32, h2: u32, h3: u32,
  ): i256 {
    return fromU(u256.fromBits(l0, l1, l2, l3, h0, h1, h2, h3));
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): i256 {
    return fromU(u256.fromBytes<T>(array, bigEndian));
  }

  @inline
  static fromBytesLE(array: u8[]): i256 {
    return fromU(u256.fromBytesLE(array));
  }

  @inline
  static fromBytesBE(array: u8[]): i256 {
    return fromU(u256.fromBytesBE(array));
  }

  @inline
  static fromUint8ArrayLE(array: Uint8Array): i256 {
    return fromU(u256.fromUint8ArrayLE(array));
  }

  @inline
  static fromUint8ArrayBE(array: Uint8Array): i256 {
    return fromU(u256.fromUint8ArrayBE(array));
  }

  /**
   * Create 256-bit signed integer from generic type T
   * @param  value
   * @returns 256-bit signed integer
   */
  @inline
  static from<T>(value: T): i256 {
         if (value instanceof bool)       return i256.fromU64(<u64>value);
    else if (value instanceof i8)         return i256.fromI64(<i64>value);
    else if (value instanceof u8)         return i256.fromU64(<u64>value);
    else if (value instanceof i16)        return i256.fromI64(<i64>value);
    else if (value instanceof u16)        return i256.fromU64(<u64>value);
    else if (value instanceof i32)        return i256.fromI64(<i64>value);
    else if (value instanceof u32)        return i256.fromU64(<u64>value);
    else if (value instanceof i64)        return i256.fromI64(<i64>value);
    else if (value instanceof u64)        return i256.fromU64(<u64>value);
    else if (value instanceof f32)        return i256.fromF64(<f64>value);
    else if (value instanceof f64)        return i256.fromF64(<f64>value);
    else if (value instanceof i128)       return i256.fromI128(<i128>value);
    else if (value instanceof u128)       return i256.fromU128(<u128>value);
    else if (value instanceof i256)       return i256.fromI256(<i256>value);
    else if (value instanceof u256)       return i256.fromU256(<u256>value);
    else if (value instanceof u8[])       return i256.fromBytes(<u8[]>value);
    else if (value instanceof Uint8Array) return i256.fromBytes(<Uint8Array>value);
    else if (value instanceof String)     return i256.fromString(<string>value);
    else throw new TypeError("Unsupported generic type");
  }

  constructor(
    public lo1: u64 = 0,
    public lo2: u64 = 0,
    public hi1: u64 = 0,
    public hi2: i64 = 0,
  ) {}

  @inline
  isPos(): bool {
    return this.hi2 >= 0;
  }

  @inline
  isNeg(): bool {
    return this.hi2 < 0;
  }

  @inline
  isZero(): bool {
    return !(this.lo1 | this.lo2 | this.hi1 | this.hi2);
  }

  @inline @operator.prefix('!')
  static isEmpty(value: i256): bool {
    return value.isZero();
  }

  @operator.prefix('~')
  not(): i256 {
    return new i256(~this.lo1, ~this.lo2, ~this.hi1, ~this.hi2);
  }

  @operator.prefix('+')
  pos(): i256 {
    return this;
  }

  /**
   * Negation, wrapping: -Min is Min
   */
  @operator.prefix('-')
  neg(): i256 {
    return fromU(asU(this).neg());
  }

  @operator.prefix('++')
  preInc(): this {
    asU(this).preInc();
    return this;
  }

  @operator.prefix('--')
  preDec(): this {
    asU(this).preDec();
    return this;
  }

  @operator.postfix('++')
  postInc(): i256 {
    return this.clone().preInc();
  }

  @operator.postfix('--')
  postDec(): i256 {
    return this.clone().preDec();
  }

  @inline @operator('|')
  static or(a: i256, b: i256): i256 {
    return new i256(a.lo1 | b.lo1, a.lo2 | b.lo2, a.hi1 | b.hi1, a.hi2 | b.hi2);
  }

  @inline @operator('^')
  static xor(a: i256, b: i256): i256 {
    return new i256(a.lo1 ^ b.lo1, a.lo2 ^ b.lo2, a.hi1 ^ b.hi1, a.hi2 ^ b.hi2);
  }

  @inline @operator('&')
  static and(a: i256, b: i256): i256 {
    return new i256(a.lo1 & b.lo1, a.lo2 & b.lo2, a.hi1 & b.hi1, a.hi2 & b.hi2);
  }

  /**
   * Shift left. Shifting by 256 bits or more (or by a negative amount) gives zero.
   */
  @inline @operator('<<')
  static shl(value: i256, shift: i32): i256 {
    return fromU(u256.shl(asU(value), shift));
  }

  /**
   * Arithmetic shift right (rounds toward negative infinity, like Solidity).
   * Shifting by 256 bits or more gives 0 for positive values and -1 for negative ones.
   */
  @operator('>>')
  static shr(value: i256, shift: i32): i256 {
    if (value.isNeg()) {
      // ~(~x >>> s) fills with ones
      return fromU(u256.shr(asU(value).not(), shift).not());
    }
    return fromU(u256.shr(asU(value), shift));
  }

  /**
   * Logical shift right (fills with zeros)
   */
  @inline @operator('>>>')
  static shr_u(value: i256, shift: i32): i256 {
    return fromU(u256.shr(asU(value), shift));
  }

  @inline @operator('+')
  static add(a: i256, b: i256): i256 {
    return fromU(u256.add(asU(a), asU(b)));
  }

  @inline @operator('-')
  static sub(a: i256, b: i256): i256 {
    return fromU(u256.sub(asU(a), asU(b)));
  }

  @inline @operator('*')
  static mul(a: i256, b: i256): i256 {
    return fromU(u256.mul(asU(a), asU(b)));
  }

  /**
   * Quotient, rounded toward zero. Throws on division by zero.
   * Like Solidity's unchecked arithmetic, Min / -1 wraps to Min.
   */
  @operator('/')
  static div(a: i256, b: i256): i256 {
    var q = u256.div(i256.absU(a), i256.absU(b));
    return (a.isNeg() != b.isNeg()) ? fromU(q.neg()) : fromU(q);
  }

  /**
   * Remainder, with the sign of the dividend. Throws on division by zero.
   */
  @operator('%')
  static rem(a: i256, b: i256): i256 {
    var r = u256.rem(i256.absU(a), i256.absU(b));
    return a.isNeg() ? fromU(r.neg()) : fromU(r);
  }

  /**
   * Calculate power of base with exponent (wrapping on overflow).
   * Negative exponents give zero, except for bases 1 and -1.
   */
  @operator('**')
  static pow(base: i256, exponent: i32): i256 {
    if (exponent < 0) {
      if (base == i256.One) return i256.One;
      if (base == i256.NegOne) return (exponent & 1) ? i256.NegOne : i256.One;
      return i256.Zero;
    }
    return fromU(u256.pow(asU(base), exponent));
  }

  @inline @operator('==')
  static eq(a: i256, b: i256): bool {
    return (
      a.lo1 == b.lo1 && a.lo2 == b.lo2 &&
      a.hi1 == b.hi1 && a.hi2 == b.hi2
    );
  }

  @inline @operator('!=')
  static ne(a: i256, b: i256): bool {
    return !i256.eq(a, b);
  }

  @operator('<')
  static lt(a: i256, b: i256): bool {
    var ah2 = a.hi2, bh2 = b.hi2;
    if (ah2 != bh2) return ah2 < bh2;
    var ah1 = a.hi1, bh1 = b.hi1;
    if (ah1 != bh1) return ah1 < bh1;
    var al2 = a.lo2, bl2 = b.lo2;
    if (al2 != bl2) return al2 < bl2;
    return a.lo1 < b.lo1;
  }

  @inline @operator('>')
  static gt(a: i256, b: i256): bool {
    return i256.lt(b, a);
  }

  @inline @operator('<=')
  static le(a: i256, b: i256): bool {
    return !i256.lt(b, a);
  }

  @inline @operator('>=')
  static ge(a: i256, b: i256): bool {
    return !i256.lt(a, b);
  }

  /**
   * Get ordering: 1 if a > b, -1 if a < b, 0 if equal
   */
  @inline
  static ord(a: i256, b: i256): i32 {
    return i32(i256.lt(b, a)) - i32(i256.lt(a, b));
  }

  @inline
  static min(a: i256, b: i256): i256 {
    return i256.lt(b, a) ? b.clone() : a.clone();
  }

  @inline
  static max(a: i256, b: i256): i256 {
    return i256.lt(a, b) ? b.clone() : a.clone();
  }

  /**
   * -1, 0 or 1
   */
  @inline
  static sign(value: i256): i32 {
    return value.isNeg() ? -1 : i32(!value.isZero());
  }

  /**
   * Absolute value, wrapping: abs(Min) is Min
   */
  @inline
  static abs(value: i256): i256 {
    return value.isNeg() ? value.neg() : value.clone();
  }

  /**
   * Absolute value as an unsigned integer (always exact, abs(Min) = 2^255)
   */
  @inline
  static absU(value: i256): u256 {
    var u = asU(value);
    return value.isNeg() ? u.neg() : u.clone();
  }

  /**
   * Integer square root, rounded down. Throws for negative values.
   */
  static sqrt(value: i256): i256 {
    if (value.isNeg()) throw new RangeError("Square root of a negative number");
    return fromU(u256.sqrt(asU(value)));
  }

  /**
   * Calculate `a * b / c` rounded toward zero, with a full precision intermediate
   * product. Throws if `c` is zero or if the result doesn't fit in 256 bits.
   */
  static muldiv(a: i256, b: i256, c: i256): i256 {
    var q = u256.muldiv(i256.absU(a), i256.absU(b), i256.absU(c));
    var neg = (a.isNeg() != b.isNeg()) != c.isNeg() && !q.isZero();
    // |result| must be <= 2^255 - 1, or 2^255 when negative
    if (q.hi2 >>> 63) {
      if (!neg || q.hi2 != 0x8000000000000000 || (q.lo1 | q.lo2 | q.hi1) != 0) {
        throw new RangeError("Overflow in muldiv");
      }
    }
    return neg ? fromU(q.neg()) : fromU(q);
  }

  @inline
  static popcnt(value: i256): i32 {
    return u256.popcnt(asU(value));
  }

  @inline
  static clz(value: i256): i32 {
    return u256.clz(asU(value));
  }

  @inline
  static ctz(value: i256): i32 {
    return u256.ctz(asU(value));
  }

  @inline
  store(ptr: usize): void {
    asU(this).store(ptr);
  }

  @inline
  static load(ptr: usize): i256 {
    return fromU(u256.load(ptr));
  }

  /**
   * Convert to 256-bit unsigned integer (same bits)
   */
  @inline
  toU256(): u256 {
    return new u256(this.lo1, this.lo2, this.hi1, this.hi2);
  }

  @inline
  toI256(): this {
    return this;
  }

  /** Low 128 bits */
  @inline
  toI128(): i128 {
    return new i128(this.lo1, this.lo2);
  }

  /** Low 128 bits */
  @inline
  toU128(): u128 {
    return new u128(this.lo1, this.lo2);
  }

  /** Low 64 bits */
  @inline
  toI64(): i64 {
    return <i64>this.lo1;
  }

  /** Low 64 bits */
  @inline
  toU64(): u64 {
    return this.lo1;
  }

  /** Low 32 bits */
  @inline
  toI32(): i32 {
    return <i32>this.lo1;
  }

  /** Low 32 bits */
  @inline
  toU32(): u32 {
    return <u32>this.lo1;
  }

  @inline
  toBool(): bool {
    return !this.isZero();
  }

  /**
   * Convert to 64-bit float, rounded to nearest (ties to even)
   */
  toF64(): f64 {
    var m = i256.absU(this);
    m.store(bufA);
    var r = __floatFromWords(bufA, 8);
    return this.isNeg() ? -r : r;
  }

  @inline
  toF32(): f32 {
    return <f32>this.toF64();
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
      else if (dummy instanceof i256)            return <T>this;
      else if (dummy instanceof u256)            return <T>this.toU256();
      else throw new TypeError('Unsupported generic type');
    } else throw new TypeError('Unsupported generic type');
  }

  /**
   * Convert to byte array (two's complement)
   * @param bigEndian Little or Big Endian? Default: false
   */
  @inline
  toBytes(bigEndian: bool = false): u8[] {
    return asU(this).toBytes(bigEndian);
  }

  @inline
  toStaticBytes(bigEndian: bool = false): StaticArray<u8> {
    return asU(this).toStaticBytes(bigEndian);
  }

  @inline
  toUint8Array(bigEndian: bool = false): Uint8Array {
    return asU(this).toUint8Array(bigEndian);
  }

  clone(): i256 {
    return new i256(this.lo1, this.lo2, this.hi1, this.hi2);
  }

  /**
   * Format in base `radix` (2 to 36) with a leading `-` for negative values
   */
  toString(radix: i32 = 10): string {
    i256.absU(this).store(bufA);
    var digits = wordsToString(bufA, 8, radix);
    return this.isNeg() ? "-" + digits : digits;
  }
}
