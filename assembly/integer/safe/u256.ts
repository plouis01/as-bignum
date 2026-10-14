import { u128Safe as u128 } from './u128';
import { i128Safe as i128 } from './i128';
import { i256Safe as i256 } from './i256';
import { u128 as U128 } from '../u128';
import { u256 as U256 } from '../u256';
import { i128 as I128 } from '../i128';
import { i256 as I256 } from '../i256';
import { bufP } from '../../multiword';

// @ts-ignore: decorator
@inline function safe(value: U256): u256 {
  return new u256(value.lo1, value.lo2, value.hi1, value.hi2);
}

/**
 * 256-bit unsigned integer with checked arithmetic: like Solidity >= 0.8, operations
 * whose result doesn't fit throw a RangeError instead of wrapping around. Division and
 * remainder by zero throw. Shifts and bitwise operations are not checked (as in Solidity).
 */
class u256 extends U256 {

  @inline static get Zero(): u256 { return new u256(); }
  @inline static get One():  u256 { return new u256(1); }
  @inline static get Min():  u256 { return new u256(); }
  @inline static get Max():  u256 { return new u256(-1, -1, -1, -1); }

  @inline
  static fromString(value: string, radix: i32 = 10): u256 {
    return safe(U256.fromString(value, radix));
  }

  @inline
  static fromU256(value: U256): u256 {
    return new u256(value.lo1, value.lo2, value.hi1, value.hi2);
  }

  @inline
  static fromI256(value: I256): u256 {
    return safe(U256.fromI256(value));
  }

  @inline
  static fromU128(value: U128): u256 {
    return safe(U256.fromU128(value));
  }

  @inline
  static fromI128(value: I128): u256 {
    return safe(U256.fromI128(value));
  }

  @inline
  static fromI64(value: i64): u256 {
    return safe(U256.fromI64(value));
  }

  @inline
  static fromU64(value: u64): u256 {
    return safe(U256.fromU64(value));
  }

  @inline
  static fromF64(value: f64): u256 {
    return safe(U256.fromF64(value));
  }

  @inline
  static fromF32(value: f32): u256 {
    return safe(U256.fromF32(value));
  }

  @inline
  static fromI32(value: i32): u256 {
    return safe(U256.fromI32(value));
  }

  @inline
  static fromU32(value: u32): u256 {
    return safe(U256.fromU32(value));
  }

  @inline
  static fromBool(value: bool): u256 {
    return safe(U256.fromBool(value));
  }

  @inline
  static fromBits(
    l0: u32, l1: u32, l2: u32, l3: u32,
    h0: u32, h1: u32, h2: u32, h3: u32,
  ): u256 {
    return safe(U256.fromBits(l0, l1, l2, l3, h0, h1, h2, h3));
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): u256 {
    return safe(U256.fromBytes<T>(array, bigEndian));
  }

  @inline
  static fromBytesLE(array: u8[]): u256 {
    return safe(U256.fromBytesLE(array));
  }

  @inline
  static fromBytesBE(array: u8[]): u256 {
    return safe(U256.fromBytesBE(array));
  }

  @inline
  static fromUint8ArrayLE(array: Uint8Array): u256 {
    return safe(U256.fromUint8ArrayLE(array));
  }

  @inline
  static fromUint8ArrayBE(array: Uint8Array): u256 {
    return safe(U256.fromUint8ArrayBE(array));
  }

  @inline
  static load(ptr: usize): u256 {
    return safe(U256.load(ptr));
  }

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
    else if (value instanceof I128)       return u256.fromI128(<I128>value);
    else if (value instanceof U128)       return u256.fromU128(<U128>value);
    else if (value instanceof I256)       return u256.fromI256(<I256>value);
    else if (value instanceof U256)       return u256.fromU256(<U256>value);
    else if (value instanceof u8[])       return u256.fromBytes(<u8[]>value);
    else if (value instanceof Uint8Array) return u256.fromBytes(<Uint8Array>value);
    else if (value instanceof String)     return u256.fromString(<string>value);
    else throw new TypeError("Unsupported generic type");
  }

  @inline @operator.prefix('~')
  not(): u256 {
    return safe(super.not());
  }

  @inline @operator.prefix('+')
  pos(): u256 {
    return this;
  }

  /**
   * Throws unless the value is zero (the negation of a positive number is negative)
   */
  @operator.prefix('-')
  neg(): u256 {
    if (!this.isZero()) throw new RangeError("Underflow during negation");
    return u256.Zero;
  }

  @operator.prefix('++')
  preInc(): this {
    if ((this.lo1 & this.lo2 & this.hi1 & this.hi2) == u64.MAX_VALUE) {
      throw new RangeError("Overflow during prefix incrementing");
    }
    super.preInc();
    return this;
  }

  @operator.prefix('--')
  preDec(): this {
    if (this.isZero()) {
      throw new RangeError("Underflow during prefix decrementing");
    }
    super.preDec();
    return this;
  }

  @inline @operator.postfix('++')
  postInc(): u256 {
    return this.clone().preInc();
  }

  @inline @operator.postfix('--')
  postDec(): u256 {
    return this.clone().preDec();
  }

  @inline @operator('|')
  static or(a: u256, b: u256): u256 {
    return safe(U256.or(a, b));
  }

  @inline @operator('^')
  static xor(a: u256, b: u256): u256 {
    return safe(U256.xor(a, b));
  }

  @inline @operator('&')
  static and(a: u256, b: u256): u256 {
    return safe(U256.and(a, b));
  }

  @inline @operator('<<')
  static shl(value: u256, shift: i32): u256 {
    return safe(U256.shl(value, shift));
  }

  @inline @operator('>>')
  static shr(value: u256, shift: i32): u256 {
    return safe(U256.shr(value, shift));
  }

  @inline @operator('>>>')
  static shr_u(value: u256, shift: i32): u256 {
    return safe(U256.shr(value, shift));
  }

  @inline
  static rotl(value: u256, shift: i32): u256 {
    return safe(U256.rotl(value, shift));
  }

  @inline
  static rotr(value: u256, shift: i32): u256 {
    return safe(U256.rotr(value, shift));
  }

  @operator('+')
  static add(a: u256, b: u256): u256 {
    var r = U256.add(a, b);
    if (U256.lt(r, a)) throw new RangeError("Overflow during addition");
    return safe(r);
  }

  @operator('-')
  static sub(a: u256, b: u256): u256 {
    if (U256.lt(a, b)) throw new RangeError("Underflow during subtraction");
    return safe(U256.sub(a, b));
  }

  @operator('*')
  static mul(a: u256, b: u256): u256 {
    // both below 2^128: the product fits
    if ((a.hi1 | a.hi2 | b.hi1 | b.hi2) == 0) return safe(U256.mul(a, b));
    if (U256.mulFull(a, b)) throw new RangeError("Overflow during multiplication");
    return u256.load(bufP);
  }

  @inline @operator('/')
  static div(a: u256, b: u256): u256 {
    return safe(U256.div(a, b));
  }

  @inline @operator('%')
  static rem(a: u256, b: u256): u256 {
    return safe(U256.rem(a, b));
  }

  @inline
  static mod(a: u256, b: u256): u256 {
    return safe(U256.rem(a, b));
  }

  /**
   * Power, throws on overflow. Negative exponents give zero (or one if `base` is one).
   */
  @operator('**')
  static pow(base: u256, exponent: i32): u256 {
    if (exponent < 0 || base.isZero() || U256.eq(base, U256.One)) {
      return safe(U256.pow(base, exponent));
    }
    var result = u256.One;
    var tmp = u256.fromU256(base);
    while (exponent > 0) {
      if (exponent & 1) result = u256.mul(result, tmp);
      exponent >>= 1;
      if (exponent) tmp = u256.mul(tmp, tmp);
    }
    return result;
  }

  @inline
  static min(a: u256, b: u256): u256 {
    return safe(U256.min(a, b));
  }

  @inline
  static max(a: u256, b: u256): u256 {
    return safe(U256.max(a, b));
  }

  @inline
  static sqrt(value: u256): u256 {
    return safe(U256.sqrt(value));
  }

  @inline
  static muldiv(a: u256, b: u256, c: u256): u256 {
    return safe(U256.muldiv(a, b, c));
  }

  @inline
  static muldivUp(a: u256, b: u256, c: u256): u256 {
    return safe(U256.muldivUp(a, b, c));
  }

  @inline
  static mulmod(a: u256, b: u256, c: u256): u256 {
    return safe(U256.mulmod(a, b, c));
  }

  @inline
  static addmod(a: u256, b: u256, c: u256): u256 {
    return safe(U256.addmod(a, b, c));
  }

  /**
   * Same value as an unchecked u256
   */
  @inline
  toUnchecked(): U256 {
    return new U256(this.lo1, this.lo2, this.hi1, this.hi2);
  }

  @inline
  as<T>(): T {
    if (isReference<T>()) {
      let dummy = changetype<T>(0);
           if (dummy instanceof u256)  return <T>this;
      else if (dummy instanceof u128)  return <T>u128.fromU256(this);
      else if (dummy instanceof i128)  return <T>i128.fromU256(this);
      else if (dummy instanceof i256)  return <T>i256.fromU256(this);
      else if (dummy instanceof U256)  return <T>this.toUnchecked();
    }
    return super.as<T>();
  }

  @inline
  clone(): u256 {
    return new u256(this.lo1, this.lo2, this.hi1, this.hi2);
  }
}

export { u256 as u256Safe };
