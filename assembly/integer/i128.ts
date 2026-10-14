import { u128 } from './u128';
import { i256 } from './i256';
import { u256 } from './u256';

import { __floatFromWords, __wordsFromFloat } from '../globals';
import { bufA, wordsToString, wordsFromString } from '../multiword';

// Signed operations reuse the unsigned ones: in two's complement, addition, subtraction,
// multiplication and the bitwise operations give the same bits for signed and unsigned
// numbers. `asU` reads an i128 as an u128 (same memory layout) without copying.

// @ts-ignore: decorator
@inline function asU(value: i128): u128 {
  return changetype<u128>(value);
}

// @ts-ignore: decorator
@inline function fromU(value: u128): i128 {
  return new i128(value.lo, value.hi);
}

export class i128 {

  @inline static get Zero(): i128 { return new i128(); }
  @inline static get One():  i128 { return new i128(1); }
  @inline static get Min():  i128 { return new i128(0, 0x8000000000000000); }
  @inline static get Max():  i128 { return new i128(u64.MAX_VALUE, 0x7FFFFFFFFFFFFFFF); }
  @inline static get NegOne(): i128 { return new i128(-1, -1); }

  /**
   * Parse a string. Accepts an optional sign and a `0x`, `0o` or `0b` prefix, and stops
   * at the first invalid character. Values that don't fit wrap around.
   */
  static fromString(value: string, radix: i32 = 10): i128 {
    wordsFromString(value, radix, bufA, 4);
    return new i128(load<u64>(bufA), load<u64>(bufA, 8));
  }

  @inline
  static fromI256(value: i256): i128 {
    return new i128(value.lo1, value.lo2);
  }

  @inline
  static fromU256(value: u256): i128 {
    return new i128(value.lo1, <i64>value.lo2);
  }

  @inline
  static fromI128(value: i128): i128 {
    return new i128(value.lo, value.hi);
  }

  @inline
  static fromU128(value: u128): i128 {
    return new i128(value.lo, <i64>value.hi);
  }

  @inline
  static fromI64(value: i64): i128 {
    return new i128(<u64>value, value >> 63);
  }

  @inline
  static fromU64(value: u64): i128 {
    return new i128(value);
  }

  /**
   * Create from a float, truncating toward zero. Values out of range keep their low
   * 128 bits. Throws on NaN and infinity.
   */
  static fromF64(value: f64): i128 {
    __wordsFromFloat(value, bufA, 4);
    return new i128(load<u64>(bufA), load<u64>(bufA, 8));
  }

  @inline
  static fromF32(value: f32): i128 {
    return i128.fromF64(<f64>value);
  }

  @inline
  static fromI32(value: i32): i128 {
    return new i128(<u64>value, <i64>(value >> 31));
  }

  @inline
  static fromU32(value: u32): i128 {
    return new i128(<u64>value);
  }

  @inline
  static fromBool(value: bool): i128 {
    return new i128(<u64>value);
  }

  @inline
  static fromBits(lo1: i32, lo2: i32, hi1: i32, hi2: i32): i128 {
    return new i128(
      <u64><u32>lo1 | ((<u64><u32>lo2) << 32),
      <i64><u32>hi1 | ((<i64><u32>hi2) << 32),
    );
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): i128 {
    if (array instanceof u8[]) {
      return bigEndian
        // @ts-ignore
        ? i128.fromBytesBE(<u8[]>array)
        // @ts-ignore
        : i128.fromBytesLE(<u8[]>array);
    } else if (array instanceof Uint8Array) {
      return bigEndian
        ? i128.fromUint8ArrayBE(<Uint8Array>array)
        : i128.fromUint8ArrayLE(<Uint8Array>array);
    } else {
      throw new TypeError("Unsupported generic type");
    }
  }

  @inline
  static fromBytesLE(array: u8[]): i128 {
    return i128.fromUint8ArrayLE(changetype<Uint8Array>(array));
  }

  @inline
  static fromBytesBE(array: u8[]): i128 {
    return i128.fromUint8ArrayBE(changetype<Uint8Array>(array));
  }

  @inline
  static fromUint8ArrayLE(array: Uint8Array): i128 {
    assert(array.length && (array.length & 15) == 0);
    var buffer = array.dataStart;
    return new i128(
      load<u64>(buffer, 0 * sizeof<u64>()),
      load<u64>(buffer, 1 * sizeof<u64>())
    );
  }

  static fromUint8ArrayBE(array: Uint8Array): i128 {
    assert(array.length && (array.length & 15) == 0);
    var buffer = array.dataStart;
    return new i128(
      bswap<u64>(load<u64>(buffer, 1 * sizeof<u64>())),
      bswap<u64>(load<u64>(buffer, 0 * sizeof<u64>()))
    );
  }

  /**
   * Create 128-bit signed integer from generic type T
   * @param  value
   * @return 128-bit signed integer
   */
  @inline
  static from<T>(value: T): i128 {
         if (value instanceof bool)       { return i128.fromU64(<u64>value); }
    else if (value instanceof i8)         { return i128.fromI64(<i64>value); }
    else if (value instanceof u8)         { return i128.fromU64(<u64>value); }
    else if (value instanceof i16)        { return i128.fromI64(<i64>value); }
    else if (value instanceof u16)        { return i128.fromU64(<u64>value); }
    else if (value instanceof i32)        { return i128.fromI64(<i64>value); }
    else if (value instanceof u32)        { return i128.fromU64(<u64>value); }
    else if (value instanceof i64)        { return i128.fromI64(<i64>value); }
    else if (value instanceof u64)        { return i128.fromU64(<u64>value); }
    else if (value instanceof f32)        { return i128.fromF64(<f64>value); }
    else if (value instanceof f64)        { return i128.fromF64(<f64>value); }
    else if (value instanceof i128)       { return i128.fromI128(<i128>value); }
    else if (value instanceof u128)       { return i128.fromU128(<u128>value); }
    else if (value instanceof i256)       { return i128.fromI256(<i256>value); }
    else if (value instanceof u256)       { return i128.fromU256(<u256>value); }
    else if (value instanceof u8[])       { return i128.fromBytes(<u8[]>value); }
    else if (value instanceof Uint8Array) { return i128.fromBytes(<Uint8Array>value); }
    else if (value instanceof String)     { return i128.fromString(<string>value); }
    else { throw new TypeError("Unsupported generic type"); }
  }

  constructor(
    public lo: u64 = 0,
    public hi: i64 = 0,
  ) {}

  @inline
  isPos(): bool {
    return this.hi >= 0;
  }

  @inline
  isNeg(): bool {
    return this.hi < 0;
  }

  @inline
  isZero(): bool {
    return !(this.lo | this.hi);
  }

  @operator.prefix('~')
  not(): i128 {
    return new i128(~this.lo, ~this.hi);
  }

  @operator.prefix('+')
  pos(): i128 {
    return this;
  }

  /**
   * Negation, wrapping: -Min is Min
   */
  @operator.prefix('-')
  neg(): i128 {
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
  postInc(): i128 {
    return this.clone().preInc();
  }

  @operator.postfix('--')
  postDec(): i128 {
    return this.clone().preDec();
  }

  @inline @operator.prefix('!')
  static isEmpty(value: i128): bool {
    return value.isZero();
  }

  @inline @operator('|')
  static or(a: i128, b: i128): i128 {
    return new i128(a.lo | b.lo, a.hi | b.hi);
  }

  @inline @operator('^')
  static xor(a: i128, b: i128): i128 {
    return new i128(a.lo ^ b.lo, a.hi ^ b.hi);
  }

  @inline @operator('&')
  static and(a: i128, b: i128): i128 {
    return new i128(a.lo & b.lo, a.hi & b.hi);
  }

  /**
   * Shift left. Shifting by 128 bits or more (or by a negative amount) gives zero.
   */
  @inline @operator('<<')
  static shl(value: i128, shift: i32): i128 {
    return fromU(u128.shl(asU(value), shift));
  }

  /**
   * Arithmetic shift right (rounds toward negative infinity, like Solidity).
   * Shifting by 128 bits or more gives 0 for positive values and -1 for negative ones.
   */
  @operator('>>')
  static shr(value: i128, shift: i32): i128 {
    if (value.isNeg()) {
      // ~(~x >>> s) fills with ones
      return fromU(u128.shr(asU(value).not(), shift).not());
    }
    return fromU(u128.shr(asU(value), shift));
  }

  /**
   * Logical shift right (fills with zeros)
   */
  @inline @operator('>>>')
  static shr_u(value: i128, shift: i32): i128 {
    return fromU(u128.shr(asU(value), shift));
  }

  @inline @operator('+')
  static add(a: i128, b: i128): i128 {
    return fromU(u128.add(asU(a), asU(b)));
  }

  @inline @operator('-')
  static sub(a: i128, b: i128): i128 {
    return fromU(u128.sub(asU(a), asU(b)));
  }

  @inline @operator('*')
  static mul(a: i128, b: i128): i128 {
    return fromU(u128.mul(asU(a), asU(b)));
  }

  /**
   * Quotient, rounded toward zero. Throws on division by zero.
   * Like Solidity's unchecked arithmetic, Min / -1 wraps to Min.
   */
  @operator('/')
  static div(a: i128, b: i128): i128 {
    var q = u128.div(i128.absU(a), i128.absU(b));
    return (a.isNeg() != b.isNeg()) ? fromU(q.neg()) : fromU(q);
  }

  /**
   * Remainder, with the sign of the dividend. Throws on division by zero.
   */
  @operator('%')
  static rem(a: i128, b: i128): i128 {
    var r = u128.rem(i128.absU(a), i128.absU(b));
    return a.isNeg() ? fromU(r.neg()) : fromU(r);
  }

  /**
   * Calculate power of base with exponent (wrapping on overflow).
   * Negative exponents give zero, except for bases 1 and -1.
   */
  @operator('**')
  static pow(base: i128, exponent: i32): i128 {
    if (exponent < 0) {
      if (base == i128.One) return i128.One;
      if (base == i128.NegOne) return (exponent & 1) ? i128.NegOne : i128.One;
      return i128.Zero;
    }
    var result = u128.One;
    var tmp = asU(base).clone();
    while (exponent > 0) {
      if (exponent & 1) result = u128.mul(result, tmp);
      exponent >>= 1;
      if (exponent) tmp = u128.mul(tmp, tmp);
    }
    return fromU(result);
  }

  @inline @operator('==')
  static eq(a: i128, b: i128): bool {
    return a.hi == b.hi && a.lo == b.lo;
  }

  @inline @operator('!=')
  static ne(a: i128, b: i128): bool {
    return !i128.eq(a, b);
  }

  @inline @operator('<')
  static lt(a: i128, b: i128): bool {
    var ah = a.hi, bh = b.hi;
    return ah == bh ? a.lo < b.lo : ah < bh;
  }

  @inline @operator('>')
  static gt(a: i128, b: i128): bool {
    var ah = a.hi, bh = b.hi;
    return ah == bh ? a.lo > b.lo : ah > bh;
  }

  @inline @operator('<=')
  static le(a: i128, b: i128): bool {
    return !i128.gt(a, b);
  }

  @inline @operator('>=')
  static ge(a: i128, b: i128): bool {
    return !i128.lt(a, b);
  }

  /**
   * Get ordering: 1 if a > b, -1 if a < b, 0 if equal
   */
  @inline
  static ord(a: i128, b: i128): i32 {
    return i32(i128.gt(a, b)) - i32(i128.lt(a, b));
  }

  @inline
  static min(a: i128, b: i128): i128 {
    return i128.lt(b, a) ? b.clone() : a.clone();
  }

  @inline
  static max(a: i128, b: i128): i128 {
    return i128.lt(a, b) ? b.clone() : a.clone();
  }

  /**
   * -1, 0 or 1
   */
  @inline
  static sign(value: i128): i32 {
    return value.isNeg() ? -1 : i32(!value.isZero());
  }

  @inline
  static popcnt(value: i128): i32 {
    return <i32>(popcnt(value.lo) + popcnt(value.hi));
  }

  @inline
  static clz(value: i128): i32 {
    return u128.clz(asU(value));
  }

  @inline
  static ctz(value: i128): i32 {
    return u128.ctz(asU(value));
  }

  /**
   * Absolute value, wrapping: abs(Min) is Min
   */
  @inline
  static abs(value: i128): i128 {
    return value.isNeg() ? value.neg() : value.clone();
  }

  /**
   * Absolute value as an unsigned integer (always exact, abs(Min) = 2^127)
   */
  @inline
  static absU(value: i128): u128 {
    var u = asU(value);
    return value.isNeg() ? u.neg() : u.clone();
  }

  /**
   * Integer square root, rounded down. Throws for negative values.
   */
  static sqrt(value: i128): i128 {
    if (value.isNeg()) throw new RangeError("Square root of a negative number");
    return fromU(u128.sqrt(asU(value)));
  }

  /**
   * Calculate `a * b / c` rounded toward zero, with a full precision intermediate
   * product. Throws if `c` is zero or if the result doesn't fit in 128 bits.
   */
  static muldiv(a: i128, b: i128, c: i128): i128 {
    var q = u128.muldiv(i128.absU(a), i128.absU(b), i128.absU(c));
    var neg = (a.isNeg() != b.isNeg()) != c.isNeg() && !q.isZero();
    // |result| must be <= 2^127 - 1, or 2^127 when negative
    if (q.hi >>> 63) {
      if (!neg || q.hi != 0x8000000000000000 || q.lo != 0) {
        throw new RangeError("Overflow in muldiv");
      }
    }
    return neg ? fromU(q.neg()) : fromU(q);
  }

  /**
   * Convert to 256-bit signed integer (sign extended)
   */
  @inline
  toI256(): i256 {
    return i256.fromI128(this);
  }

  /**
   * Convert to 256-bit unsigned integer (sign extended two's complement)
   */
  @inline
  toU256(): u256 {
    return u256.fromI128(this);
  }

  @inline
  toI128(): this {
    return this;
  }

  /**
   * Convert to 128-bit unsigned integer (same bits)
   */
  @inline
  toU128(): u128 {
    return new u128(this.lo, this.hi);
  }

  /** Low 64 bits */
  @inline
  toI64(): i64 {
    return <i64>this.lo;
  }

  /** Low 64 bits */
  @inline
  toU64(): u64 {
    return this.lo;
  }

  /** Low 32 bits */
  @inline
  toI32(): i32 {
    return <i32>this.lo;
  }

  /** Low 32 bits */
  @inline
  toU32(): u32 {
    return <u32>this.lo;
  }

  @inline
  toBool(): bool {
    return !this.isZero();
  }

  /**
   * Convert to 64-bit float, rounded to nearest (ties to even)
   */
  toF64(): f64 {
    var m = i128.absU(this);
    store<u64>(bufA, m.lo);
    store<u64>(bufA, m.hi, 8);
    var r = __floatFromWords(bufA, 4);
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
      else if (dummy instanceof i128)            return <T>this;
      else if (dummy instanceof u128)            return <T>this.toU128();
      else if (dummy instanceof i256)            return <T>this.toI256();
      else if (dummy instanceof u256)            return <T>this.toU256();
      else throw new TypeError('Unsupported generic type');
    } else throw new TypeError('Unsupported generic type');
  }

  @inline
  private toArrayBufferLE(buffer: usize): void {
    store<u64>(buffer, this.lo, 0 * sizeof<u64>());
    store<u64>(buffer, this.hi, 1 * sizeof<u64>());
  }

  @inline
  private toArrayBufferBE(buffer: usize): void {
    store<u64>(buffer, bswap<u64>(this.hi), 0 * sizeof<u64>());
    store<u64>(buffer, bswap<u64>(this.lo), 1 * sizeof<u64>());
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
   * Convert to byte array
   * @param bigEndian Little or Big Endian? Default: false
   * @returns  Array of bytes
   */
   @inline
   toBytes(bigEndian: bool = false): u8[] {
     var result = new Array<u8>(16);
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
      var result = new StaticArray<u8>(16);
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
     var result = new Uint8Array(16);
     this.toArrayBuffer(result.dataStart, bigEndian);
     return result;
   }

  clone(): i128 {
    return new i128(this.lo, this.hi);
  }

  /**
   * Format in base `radix` (2 to 36) with a leading `-` for negative values
   */
  toString(radix: i32 = 10): string {
    var m = i128.absU(this);
    store<u64>(bufA, m.lo);
    store<u64>(bufA, m.hi, 8);
    var digits = wordsToString(bufA, 4, radix);
    return this.isNeg() ? "-" + digits : digits;
  }
}
