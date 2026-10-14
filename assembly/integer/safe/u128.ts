import { u256Safe as u256 } from './u256';
import { i128Safe as i128 } from './i128';
import { i256Safe as i256 } from './i256';
import { u128 as U128 } from '../u128';
import { u256 as U256 } from '../u256';
import { i128 as I128 } from '../i128';
import { i256 as I256 } from '../i256';
import { bufP } from '../../multiword';

// @ts-ignore: decorator
@inline function safe(value: U128): u128 {
  return new u128(value.lo, value.hi);
}

/**
 * 128-bit unsigned integer with checked arithmetic: like Solidity >= 0.8, operations
 * whose result doesn't fit throw a RangeError instead of wrapping around. Division and
 * remainder by zero throw. Shifts and bitwise operations are not checked (as in Solidity).
 */
class u128 extends U128 {

  @inline static get Zero(): u128 { return new u128(); }
  @inline static get One():  u128 { return new u128(1); }
  @inline static get Min():  u128 { return new u128(); }
  @inline static get Max():  u128 { return new u128(-1, -1); }

  @inline
  static fromString(value: string, radix: i32 = 10): u128 {
    return safe(U128.fromString(value, radix));
  }

  @inline
  static fromI256(value: I256): u128 {
    return safe(U128.fromI256(value));
  }

  @inline
  static fromU256(value: U256): u128 {
    return safe(U128.fromU256(value));
  }

  @inline
  static fromI128(value: I128): u128 {
    return safe(U128.fromI128(value));
  }

  @inline
  static fromU128(value: U128): u128 {
    return safe(value);
  }

  @inline
  static fromI64(value: i64): u128 {
    return safe(U128.fromI64(value));
  }

  @inline
  static fromU64(value: u64): u128 {
    return safe(U128.fromU64(value));
  }

  @inline
  static fromF64(value: f64): u128 {
    return safe(U128.fromF64(value));
  }

  @inline
  static fromF32(value: f32): u128 {
    return safe(U128.fromF32(value));
  }

  @inline
  static fromI32(value: i32): u128 {
    return safe(U128.fromI32(value));
  }

  @inline
  static fromU32(value: u32): u128 {
    return safe(U128.fromU32(value));
  }

  @inline
  static fromBool(value: bool): u128 {
    return safe(U128.fromBool(value));
  }

  @inline
  static fromBits(lo1: u32, lo2: u32, hi1: u32, hi2: u32): u128 {
    return safe(U128.fromBits(lo1, lo2, hi1, hi2));
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): u128 {
    return safe(U128.fromBytes<T>(array, bigEndian));
  }

  @inline
  static fromBytesLE(array: u8[]): u128 {
    return safe(U128.fromBytesLE(array));
  }

  @inline
  static fromBytesBE(array: u8[]): u128 {
    return safe(U128.fromBytesBE(array));
  }

  @inline
  static fromUint8ArrayLE(array: Uint8Array): u128 {
    return safe(U128.fromUint8ArrayLE(array));
  }

  @inline
  static fromUint8ArrayBE(array: Uint8Array): u128 {
    return safe(U128.fromUint8ArrayBE(array));
  }

  /**
   * Create 128-bit unsigned integer from generic type T
   * @param  value
   * @returns 128-bit unsigned integer
   */
  @inline
  static from<T>(value: T): u128 {
         if (value instanceof bool)       return u128.fromU64(<u64>value);
    else if (value instanceof i8)         return u128.fromI64(<i64>value);
    else if (value instanceof u8)         return u128.fromU64(<u64>value);
    else if (value instanceof i16)        return u128.fromI64(<i64>value);
    else if (value instanceof u16)        return u128.fromU64(<u64>value);
    else if (value instanceof i32)        return u128.fromI64(<i64>value);
    else if (value instanceof u32)        return u128.fromU64(<u64>value);
    else if (value instanceof i64)        return u128.fromI64(<i64>value);
    else if (value instanceof u64)        return u128.fromU64(<u64>value);
    else if (value instanceof f32)        return u128.fromF64(<f64>value);
    else if (value instanceof f64)        return u128.fromF64(<f64>value);
    else if (value instanceof I128)       return u128.fromI128(<I128>value);
    else if (value instanceof U128)       return u128.fromU128(<U128>value);
    else if (value instanceof I256)       return u128.fromI256(<I256>value);
    else if (value instanceof U256)       return u128.fromU256(<U256>value);
    else if (value instanceof u8[])       return u128.fromBytes(<u8[]>value);
    else if (value instanceof Uint8Array) return u128.fromBytes(<Uint8Array>value);
    else if (value instanceof String)     return u128.fromString(<string>value);
    else throw new TypeError("Unsupported generic type");
  }

  @inline @operator.prefix('~')
  not(): u128 {
    return safe(super.not());
  }

  @inline @operator.prefix('+')
  pos(): u128 {
    return this;
  }

  /**
   * Throws unless the value is zero (the negation of a positive number is negative)
   */
  @operator.prefix('-')
  neg(): u128 {
    if (!this.isZero()) throw new RangeError("Underflow during negation");
    return u128.Zero;
  }

  @inline @operator('|')
  static or(a: u128, b: u128): u128 {
    return safe(U128.or(a, b));
  }

  @inline @operator('^')
  static xor(a: u128, b: u128): u128 {
    return safe(U128.xor(a, b));
  }

  @inline @operator('&')
  static and(a: u128, b: u128): u128 {
    return safe(U128.and(a, b));
  }

  @inline @operator('<<')
  static shl(value: u128, shift: i32): u128 {
    return safe(U128.shl(value, shift));
  }

  @inline @operator('>>')
  static shr(value: u128, shift: i32): u128 {
   return safe(U128.shr(value, shift));
  }

  @inline @operator('>>>')
  static shr_u(value: u128, shift: i32): u128 {
    return safe(U128.shr(value, shift));
  }

  @inline
  static rotl(value: u128, shift: i32): u128 {
    return safe(U128.rotl(value, shift));
  }

  @inline
  static rotr(value: u128, shift: i32): u128 {
    return safe(U128.rotr(value, shift));
  }

  @operator.prefix('++')
  preInc(): this {
    if ((this.lo & this.hi) == <u64>-1) { // if this == max
      throw new RangeError('Overflow during prefix incrementing');
    }
    super.preInc();
    return this;
  }

  @operator.prefix('--')
  preDec(): this {
    if ((this.lo | this.hi) == 0) { // if this == 0
      throw new RangeError('Underflow during prefix decrementing');
    }
    super.preDec();
    return this;
  }

  @inline @operator.postfix('++')
  postInc(): u128 {
    return this.clone().preInc();
  }

  @inline @operator.postfix('--')
  postDec(): u128 {
    return this.clone().preDec();
  }

  @operator('+')
  static add(a: u128, b: u128): u128 {
    var r = U128.add(a, b);
    if (U128.lt(r, a)) throw new RangeError('Overflow during addition');
    return safe(r);
  }

  @operator('-')
  static sub(a: u128, b: u128): u128 {
    if (U128.lt(a, b)) throw new RangeError("Underflow during subtraction");
    return safe(U128.sub(a, b));
  }

  @operator('*')
  static mul(a: u128, b: u128): u128 {
    // both below 2^64: the product fits
    if ((a.hi | b.hi) == 0) return safe(U128.mul(a, b));
    if (U128.mulFull(a, b)) throw new RangeError("Overflow during multiplication");
    return new u128(load<u64>(bufP), load<u64>(bufP, 8));
  }

  @inline @operator('/')
  static div(a: u128, b: u128): u128 {
    return safe(U128.div(a, b));
  }

  @inline @operator('%')
  static rem(a: u128, b: u128): u128 {
    return safe(U128.rem(a, b));
  }

  /**
   * Power, throws on overflow. Negative exponents give zero (or one if `base` is one).
   */
  @operator('**')
  static pow(base: u128, exponent: i32): u128 {
    if (exponent < 0 || base.isZero() || U128.eq(base, U128.One)) {
      return safe(U128.pow(base, exponent));
    }
    var result = u128.One;
    var tmp = safe(base);
    while (exponent > 0) {
      if (exponent & 1) result = u128.mul(result, tmp);
      exponent >>= 1;
      if (exponent) tmp = u128.mul(tmp, tmp);
    }
    return result;
  }

  @inline
  static div10(value: u128): u128 {
    return safe(U128.div10(value));
  }

  @inline
  static rem10(value: u128): u128 {
    return safe(U128.rem10(value));
  }

  @inline
  static min(a: u128, b: u128): u128 {
    return safe(U128.min(a, b));
  }

  @inline
  static max(a: u128, b: u128): u128 {
    return safe(U128.max(a, b));
  }

  // compute floor(sqrt(x))
  @inline
  static sqrt(value: u128): u128 {
    return safe(U128.sqrt(value));
  }

  @inline
  static muldiv(number: u128, numerator: u128, denominator: u128): u128 {
    return safe(U128.muldiv(number, numerator, denominator));
  }

  @inline
  static muldivUp(number: u128, numerator: u128, denominator: u128): u128 {
    return safe(U128.muldivUp(number, numerator, denominator));
  }

  @inline
  static mulmod(a: u128, b: u128, c: u128): u128 {
    return safe(U128.mulmod(a, b, c));
  }

  @inline
  static addmod(a: u128, b: u128, c: u128): u128 {
    return safe(U128.addmod(a, b, c));
  }

  /**
   * Same value as an unchecked u128
   */
  @inline
  toUnchecked(): U128 {
    return new U128(this.lo, this.hi);
  }

  @inline
  as<T>(): T {
    if (isReference<T>()) {
      let dummy = changetype<T>(0);
           if (dummy instanceof u128)  return <T>this;
      else if (dummy instanceof i128)  return <T>i128.fromU128(this);
      else if (dummy instanceof u256)  return <T>u256.fromU128(this);
      else if (dummy instanceof i256)  return <T>i256.fromU128(this);
      else if (dummy instanceof U128)  return <T>this.toUnchecked();
    }
    return super.as<T>();
  }

  @inline
  clone(): u128 {
    return new u128(this.lo, this.hi);
  }
}

export { u128 as u128Safe };
