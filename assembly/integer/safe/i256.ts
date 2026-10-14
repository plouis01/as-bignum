import { u128Safe as u128 } from './u128';
import { i128Safe as i128 } from './i128';
import { u256Safe as u256 } from './u256';
import { u128 as U128 } from '../u128';
import { u256 as U256 } from '../u256';
import { i128 as I128 } from '../i128';
import { i256 as I256 } from '../i256';
import { bufP } from '../../multiword';

// @ts-ignore: decorator
@inline function safe(value: I256): i256 {
  return new i256(value.lo1, value.lo2, value.hi1, value.hi2);
}

/**
 * 256-bit signed integer with checked arithmetic: like Solidity >= 0.8, operations
 * whose result doesn't fit throw a RangeError instead of wrapping around (including
 * Min / -1, -Min and abs(Min)). Division and remainder by zero throw. Shifts and bitwise
 * operations are not checked (as in Solidity).
 */
class i256 extends I256 {

  @inline static get Zero(): i256 { return new i256(); }
  @inline static get One():  i256 { return new i256(1); }
  @inline static get NegOne(): i256 { return new i256(-1, -1, -1, -1); }
  @inline static get Min():  i256 { return new i256(0, 0, 0, 0x8000000000000000); }
  @inline static get Max():  i256 { return new i256(-1, -1, -1, 0x7FFFFFFFFFFFFFFF); }

  @inline
  static fromString(value: string, radix: i32 = 10): i256 {
    return safe(I256.fromString(value, radix));
  }

  @inline
  static fromI256(value: I256): i256 {
    return safe(value);
  }

  @inline
  static fromU256(value: U256): i256 {
    return safe(I256.fromU256(value));
  }

  @inline
  static fromI128(value: I128): i256 {
    return safe(I256.fromI128(value));
  }

  @inline
  static fromU128(value: U128): i256 {
    return safe(I256.fromU128(value));
  }

  @inline
  static fromI64(value: i64): i256 {
    return safe(I256.fromI64(value));
  }

  @inline
  static fromU64(value: u64): i256 {
    return safe(I256.fromU64(value));
  }

  @inline
  static fromI32(value: i32): i256 {
    return safe(I256.fromI32(value));
  }

  @inline
  static fromU32(value: u32): i256 {
    return safe(I256.fromU32(value));
  }

  @inline
  static fromBool(value: bool): i256 {
    return safe(I256.fromBool(value));
  }

  @inline
  static fromF64(value: f64): i256 {
    return safe(I256.fromF64(value));
  }

  @inline
  static fromF32(value: f32): i256 {
    return safe(I256.fromF32(value));
  }

  @inline
  static fromBits(
    l0: u32, l1: u32, l2: u32, l3: u32,
    h0: u32, h1: u32, h2: u32, h3: u32,
  ): i256 {
    return safe(I256.fromBits(l0, l1, l2, l3, h0, h1, h2, h3));
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): i256 {
    return safe(I256.fromBytes<T>(array, bigEndian));
  }

  @inline
  static fromBytesLE(array: u8[]): i256 {
    return safe(I256.fromBytesLE(array));
  }

  @inline
  static fromBytesBE(array: u8[]): i256 {
    return safe(I256.fromBytesBE(array));
  }

  @inline
  static fromUint8ArrayLE(array: Uint8Array): i256 {
    return safe(I256.fromUint8ArrayLE(array));
  }

  @inline
  static fromUint8ArrayBE(array: Uint8Array): i256 {
    return safe(I256.fromUint8ArrayBE(array));
  }

  @inline
  static load(ptr: usize): i256 {
    return safe(I256.load(ptr));
  }

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
    else if (value instanceof I128)       return i256.fromI128(<I128>value);
    else if (value instanceof U128)       return i256.fromU128(<U128>value);
    else if (value instanceof I256)       return i256.fromI256(<I256>value);
    else if (value instanceof U256)       return i256.fromU256(<U256>value);
    else if (value instanceof u8[])       return i256.fromBytes(<u8[]>value);
    else if (value instanceof Uint8Array) return i256.fromBytes(<Uint8Array>value);
    else if (value instanceof String)     return i256.fromString(<string>value);
    else throw new TypeError("Unsupported generic type");
  }

  @inline @operator.prefix('~')
  not(): i256 {
    return safe(super.not());
  }

  @inline @operator.prefix('+')
  pos(): i256 {
    return this;
  }

  @operator.prefix('-')
  neg(): i256 {
    if (I256.eq(this, I256.Min)) throw new RangeError("Overflow during negation");
    return safe(super.neg());
  }

  @operator.prefix('++')
  preInc(): this {
    if (I256.eq(this, I256.Max)) throw new RangeError("Overflow during prefix incrementing");
    super.preInc();
    return this;
  }

  @operator.prefix('--')
  preDec(): this {
    if (I256.eq(this, I256.Min)) throw new RangeError("Underflow during prefix decrementing");
    super.preDec();
    return this;
  }

  @inline @operator.postfix('++')
  postInc(): i256 {
    return this.clone().preInc();
  }

  @inline @operator.postfix('--')
  postDec(): i256 {
    return this.clone().preDec();
  }

  @inline @operator('|')
  static or(a: i256, b: i256): i256 {
    return safe(I256.or(a, b));
  }

  @inline @operator('^')
  static xor(a: i256, b: i256): i256 {
    return safe(I256.xor(a, b));
  }

  @inline @operator('&')
  static and(a: i256, b: i256): i256 {
    return safe(I256.and(a, b));
  }

  @inline @operator('<<')
  static shl(value: i256, shift: i32): i256 {
    return safe(I256.shl(value, shift));
  }

  @inline @operator('>>')
  static shr(value: i256, shift: i32): i256 {
    return safe(I256.shr(value, shift));
  }

  @inline @operator('>>>')
  static shr_u(value: i256, shift: i32): i256 {
    return safe(I256.shr_u(value, shift));
  }

  @operator('+')
  static add(a: i256, b: i256): i256 {
    var r = I256.add(a, b);
    // overflow iff both operands have the same sign and the result has the other one
    if (a.isNeg() == b.isNeg() && r.isNeg() != a.isNeg()) {
      throw new RangeError("Overflow during addition");
    }
    return safe(r);
  }

  @operator('-')
  static sub(a: i256, b: i256): i256 {
    var r = I256.sub(a, b);
    if (a.isNeg() != b.isNeg() && r.isNeg() != a.isNeg()) {
      throw new RangeError("Overflow during subtraction");
    }
    return safe(r);
  }

  @operator('*')
  static mul(a: i256, b: i256): i256 {
    var neg = a.isNeg() != b.isNeg();
    if (U256.mulFull(I256.absU(a), I256.absU(b))) {
      throw new RangeError("Overflow during multiplication");
    }
    var m = U256.load(bufP);
    // |result| must be <= 2^255 - 1, or 2^255 when negative
    if (m.hi2 >>> 63) {
      if (!neg || m.hi2 != 0x8000000000000000 || (m.lo1 | m.lo2 | m.hi1) != 0) {
        throw new RangeError("Overflow during multiplication");
      }
    }
    return neg ? safe(I256.fromU256(m).neg()) : safe(I256.fromU256(m));
  }

  @operator('/')
  static div(a: i256, b: i256): i256 {
    if (I256.eq(a, I256.Min) && I256.eq(b, I256.NegOne)) {
      throw new RangeError("Overflow during division");
    }
    return safe(I256.div(a, b));
  }

  @inline @operator('%')
  static rem(a: i256, b: i256): i256 {
    return safe(I256.rem(a, b));
  }

  /**
   * Power, throws on overflow. Negative exponents give zero, except for bases 1 and -1.
   */
  @operator('**')
  static pow(base: i256, exponent: i32): i256 {
    if (
      exponent < 0 || base.isZero() ||
      I256.eq(base, I256.One) || I256.eq(base, I256.NegOne)
    ) {
      return safe(I256.pow(base, exponent));
    }
    var result = i256.One;
    var tmp = safe(base);
    while (exponent > 0) {
      if (exponent & 1) result = i256.mul(result, tmp);
      exponent >>= 1;
      if (exponent) tmp = i256.mul(tmp, tmp);
    }
    return result;
  }

  @inline
  static min(a: i256, b: i256): i256 {
    return safe(I256.min(a, b));
  }

  @inline
  static max(a: i256, b: i256): i256 {
    return safe(I256.max(a, b));
  }

  /**
   * Absolute value, throws for Min
   */
  @inline
  static abs(value: i256): i256 {
    return value.isNeg() ? value.neg() : value.clone();
  }

  @inline
  static sqrt(value: i256): i256 {
    return safe(I256.sqrt(value));
  }

  @inline
  static muldiv(a: i256, b: i256, c: i256): i256 {
    return safe(I256.muldiv(a, b, c));
  }

  /**
   * Same value as an unchecked i256
   */
  @inline
  toUnchecked(): I256 {
    return new I256(this.lo1, this.lo2, this.hi1, this.hi2);
  }

  @inline
  as<T>(): T {
    if (isReference<T>()) {
      let dummy = changetype<T>(0);
           if (dummy instanceof i256)  return <T>this;
      else if (dummy instanceof u128)  return <T>u128.fromI256(this);
      else if (dummy instanceof i128)  return <T>i128.fromI256(this);
      else if (dummy instanceof u256)  return <T>u256.fromI256(this);
      else if (dummy instanceof I256)  return <T>this.toUnchecked();
    }
    return super.as<T>();
  }

  @inline
  clone(): i256 {
    return new i256(this.lo1, this.lo2, this.hi1, this.hi2);
  }
}

export { i256 as i256Safe };
