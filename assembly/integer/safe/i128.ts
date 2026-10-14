import { u128Safe as u128 } from './u128';
import { u256Safe as u256 } from './u256';
import { i256Safe as i256 } from './i256';
import { u128 as U128 } from '../u128';
import { u256 as U256 } from '../u256';
import { i128 as I128 } from '../i128';
import { i256 as I256 } from '../i256';
import { bufP } from '../../multiword';

// @ts-ignore: decorator
@inline function safe(value: I128): i128 {
  return new i128(value.lo, value.hi);
}

/**
 * 128-bit signed integer with checked arithmetic: like Solidity >= 0.8, operations
 * whose result doesn't fit throw a RangeError instead of wrapping around (including
 * Min / -1, -Min and abs(Min)). Division and remainder by zero throw. Shifts and bitwise
 * operations are not checked (as in Solidity).
 */
class i128 extends I128 {

  @inline static get Zero(): i128 { return new i128(); }
  @inline static get One():  i128 { return new i128(1); }
  @inline static get Min():  i128 { return new i128(0, 0x8000000000000000); }
  @inline static get Max():  i128 { return new i128(u64.MAX_VALUE, 0x7FFFFFFFFFFFFFFF); }
  @inline static get NegOne(): i128 { return new i128(-1, -1); }

  @inline
  static fromString(value: string, radix: i32 = 10): i128 {
    return safe(I128.fromString(value, radix));
  }

  @inline
  static fromI256(value: I256): i128 {
    return safe(I128.fromI256(value));
  }

  @inline
  static fromU256(value: U256): i128 {
    return safe(I128.fromU256(value));
  }

  @inline
  static fromI128(value: I128): i128 {
    return safe(value);
  }

  @inline
  static fromU128(value: U128): i128 {
    return safe(I128.fromU128(value));
  }

  @inline
  static fromI64(value: i64): i128 {
    return safe(I128.fromI64(value));
  }

  @inline
  static fromU64(value: u64): i128 {
    return safe(I128.fromU64(value));
  }

  @inline
  static fromF64(value: f64): i128 {
    return safe(I128.fromF64(value));
  }

  @inline
  static fromF32(value: f32): i128 {
    return safe(I128.fromF32(value));
  }

  @inline
  static fromI32(value: i32): i128 {
    return safe(I128.fromI32(value));
  }

  @inline
  static fromU32(value: u32): i128 {
    return safe(I128.fromU32(value));
  }

  @inline
  static fromBool(value: bool): i128 {
    return safe(I128.fromBool(value));
  }

  @inline
  static fromBits(lo1: i32, lo2: i32, hi1: i32, hi2: i32): i128 {
    return safe(I128.fromBits(lo1, lo2, hi1, hi2));
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): i128 {
    return safe(I128.fromBytes<T>(array, bigEndian));
  }

  @inline
  static fromBytesLE(array: u8[]): i128 {
    return safe(I128.fromBytesLE(array));
  }

  @inline
  static fromBytesBE(array: u8[]): i128 {
    return safe(I128.fromBytesBE(array));
  }

  @inline
  static fromUint8ArrayLE(array: Uint8Array): i128 {
    return safe(I128.fromUint8ArrayLE(array));
  }

  @inline
  static fromUint8ArrayBE(array: Uint8Array): i128 {
    return safe(I128.fromUint8ArrayBE(array));
  }

  @inline
  static from<T>(value: T): i128 {
         if (value instanceof bool)       return i128.fromU64(<u64>value);
    else if (value instanceof i8)         return i128.fromI64(<i64>value);
    else if (value instanceof u8)         return i128.fromU64(<u64>value);
    else if (value instanceof i16)        return i128.fromI64(<i64>value);
    else if (value instanceof u16)        return i128.fromU64(<u64>value);
    else if (value instanceof i32)        return i128.fromI64(<i64>value);
    else if (value instanceof u32)        return i128.fromU64(<u64>value);
    else if (value instanceof i64)        return i128.fromI64(<i64>value);
    else if (value instanceof u64)        return i128.fromU64(<u64>value);
    else if (value instanceof f32)        return i128.fromF64(<f64>value);
    else if (value instanceof f64)        return i128.fromF64(<f64>value);
    else if (value instanceof I128)       return i128.fromI128(<I128>value);
    else if (value instanceof U128)       return i128.fromU128(<U128>value);
    else if (value instanceof I256)       return i128.fromI256(<I256>value);
    else if (value instanceof U256)       return i128.fromU256(<U256>value);
    else if (value instanceof u8[])       return i128.fromBytes(<u8[]>value);
    else if (value instanceof Uint8Array) return i128.fromBytes(<Uint8Array>value);
    else if (value instanceof String)     return i128.fromString(<string>value);
    else throw new TypeError("Unsupported generic type");
  }

  @inline @operator.prefix('~')
  not(): i128 {
    return safe(super.not());
  }

  @inline @operator.prefix('+')
  pos(): i128 {
    return this;
  }

  @operator.prefix('-')
  neg(): i128 {
    if (I128.eq(this, I128.Min)) throw new RangeError("Overflow during negation");
    return safe(super.neg());
  }

  @operator.prefix('++')
  preInc(): this {
    if (I128.eq(this, I128.Max)) throw new RangeError("Overflow during prefix incrementing");
    super.preInc();
    return this;
  }

  @operator.prefix('--')
  preDec(): this {
    if (I128.eq(this, I128.Min)) throw new RangeError("Underflow during prefix decrementing");
    super.preDec();
    return this;
  }

  @inline @operator.postfix('++')
  postInc(): i128 {
    return this.clone().preInc();
  }

  @inline @operator.postfix('--')
  postDec(): i128 {
    return this.clone().preDec();
  }

  @inline @operator('|')
  static or(a: i128, b: i128): i128 {
    return safe(I128.or(a, b));
  }

  @inline @operator('^')
  static xor(a: i128, b: i128): i128 {
    return safe(I128.xor(a, b));
  }

  @inline @operator('&')
  static and(a: i128, b: i128): i128 {
    return safe(I128.and(a, b));
  }

  @inline @operator('<<')
  static shl(value: i128, shift: i32): i128 {
    return safe(I128.shl(value, shift));
  }

  @inline @operator('>>')
  static shr(value: i128, shift: i32): i128 {
    return safe(I128.shr(value, shift));
  }

  @inline @operator('>>>')
  static shr_u(value: i128, shift: i32): i128 {
    return safe(I128.shr_u(value, shift));
  }

  @operator('+')
  static add(a: i128, b: i128): i128 {
    var r = I128.add(a, b);
    // overflow iff both operands have the same sign and the result has the other one
    if (a.isNeg() == b.isNeg() && r.isNeg() != a.isNeg()) {
      throw new RangeError("Overflow during addition");
    }
    return safe(r);
  }

  @operator('-')
  static sub(a: i128, b: i128): i128 {
    var r = I128.sub(a, b);
    if (a.isNeg() != b.isNeg() && r.isNeg() != a.isNeg()) {
      throw new RangeError("Overflow during subtraction");
    }
    return safe(r);
  }

  @operator('*')
  static mul(a: i128, b: i128): i128 {
    var neg = a.isNeg() != b.isNeg();
    if (U128.mulFull(I128.absU(a), I128.absU(b))) {
      throw new RangeError("Overflow during multiplication");
    }
    var lo = load<u64>(bufP);
    var hi = load<u64>(bufP, 8);
    // |result| must be <= 2^127 - 1, or 2^127 when negative
    if (hi >>> 63) {
      if (!neg || hi != 0x8000000000000000 || lo != 0) {
        throw new RangeError("Overflow during multiplication");
      }
    }
    var r = new I128(lo, hi);
    return neg ? safe(r.neg()) : safe(r);
  }

  @operator('/')
  static div(a: i128, b: i128): i128 {
    if (I128.eq(a, I128.Min) && I128.eq(b, I128.NegOne)) {
      throw new RangeError("Overflow during division");
    }
    return safe(I128.div(a, b));
  }

  @inline @operator('%')
  static rem(a: i128, b: i128): i128 {
    return safe(I128.rem(a, b));
  }

  /**
   * Power, throws on overflow. Negative exponents give zero, except for bases 1 and -1.
   */
  @operator('**')
  static pow(base: i128, exponent: i32): i128 {
    if (
      exponent < 0 || base.isZero() ||
      I128.eq(base, I128.One) || I128.eq(base, I128.NegOne)
    ) {
      return safe(I128.pow(base, exponent));
    }
    var result = i128.One;
    var tmp = safe(base);
    while (exponent > 0) {
      if (exponent & 1) result = i128.mul(result, tmp);
      exponent >>= 1;
      if (exponent) tmp = i128.mul(tmp, tmp);
    }
    return result;
  }

  @inline
  static min(a: i128, b: i128): i128 {
    return safe(I128.min(a, b));
  }

  @inline
  static max(a: i128, b: i128): i128 {
    return safe(I128.max(a, b));
  }

  /**
   * Absolute value, throws for Min
   */
  @inline
  static abs(value: i128): i128 {
    return value.isNeg() ? value.neg() : value.clone();
  }

  @inline
  static sqrt(value: i128): i128 {
    return safe(I128.sqrt(value));
  }

  @inline
  static muldiv(a: i128, b: i128, c: i128): i128 {
    return safe(I128.muldiv(a, b, c));
  }

  /**
   * Same value as an unchecked i128
   */
  @inline
  toUnchecked(): I128 {
    return new I128(this.lo, this.hi);
  }

  @inline
  as<T>(): T {
    if (isReference<T>()) {
      let dummy = changetype<T>(0);
           if (dummy instanceof i128)  return <T>this;
      else if (dummy instanceof u128)  return <T>u128.fromI128(this);
      else if (dummy instanceof i256)  return <T>i256.fromI128(this);
      else if (dummy instanceof u256)  return <T>u256.fromI128(this);
      else if (dummy instanceof I128)  return <T>this.toUnchecked();
    }
    return super.as<T>();
  }

  @inline
  clone(): i128 {
    return new i128(this.lo, this.hi);
  }
}

export { i128 as i128Safe };
