import { i128 } from '../../integer/i128';
import { u128 } from '../../integer/u128';
import { fp128 } from '../fp128';
import { getFixedOverflow } from '../core';

// @ts-ignore: decorator
@inline function check<Q>(value: fp128<Q>, operation: string): fp128Safe<Q> {
  if (getFixedOverflow()) throw new RangeError("Overflow during " + operation);
  return new fp128Safe<Q>(value.value);
}

/**
 * Signed fixed point number on 128 bits with checked arithmetic: operations whose result
 * doesn't fit throw a RangeError instead of wrapping around. See `fp128`.
 */
export class fp128Safe<Q> extends fp128<Q> {

  @inline static Zero<Q>(): fp128Safe<Q> { return new fp128Safe<Q>(); }
  @inline static One<Q>():  fp128Safe<Q> { return new fp128Safe<Q>(fp128.One<Q>().value); }
  @inline static Min<Q>():  fp128Safe<Q> { return new fp128Safe<Q>(i128.Min); }
  @inline static Max<Q>():  fp128Safe<Q> { return new fp128Safe<Q>(i128.Max); }
  @inline static Epsilon<Q>(): fp128Safe<Q> { return new fp128Safe<Q>(i128.One); }

  @inline
  static fromRaw<Q>(value: i128): fp128Safe<Q> {
    return new fp128Safe<Q>(value.clone());
  }

  @inline
  static fromI128<Q>(value: i128): fp128Safe<Q> {
    return check<Q>(fp128.fromI128<Q>(value), "conversion");
  }

  @inline
  static fromU128<Q>(value: u128): fp128Safe<Q> {
    return check<Q>(fp128.fromU128<Q>(value), "conversion");
  }

  @inline
  static fromI64<Q>(value: i64): fp128Safe<Q> {
    return check<Q>(fp128.fromI64<Q>(value), "conversion");
  }

  @inline
  static fromU64<Q>(value: u64): fp128Safe<Q> {
    return check<Q>(fp128.fromU64<Q>(value), "conversion");
  }

  @inline
  static fromI32<Q>(value: i32): fp128Safe<Q> {
    return check<Q>(fp128.fromI32<Q>(value), "conversion");
  }

  @inline
  static fromU32<Q>(value: u32): fp128Safe<Q> {
    return check<Q>(fp128.fromU32<Q>(value), "conversion");
  }

  @inline
  static fromF64<Q>(value: f64): fp128Safe<Q> {
    return check<Q>(fp128.fromF64<Q>(value), "conversion");
  }

  @inline
  static fromF32<Q>(value: f32): fp128Safe<Q> {
    return check<Q>(fp128.fromF32<Q>(value), "conversion");
  }

  @inline
  static fromString<Q>(value: string): fp128Safe<Q> {
    return check<Q>(fp128.fromString<Q>(value), "conversion");
  }

  @inline
  static from<Q, T>(value: T): fp128Safe<Q> {
    if (value instanceof fp128<Q>) return new fp128Safe<Q>((<fp128<Q>>value).value.clone());
    return check<Q>(fp128.from<Q, T>(value), "conversion");
  }

  @operator.prefix('+')
  pos(): fp128Safe<Q> {
    return this;
  }

  @operator.prefix('-')
  neg(): fp128Safe<Q> {
    return check<Q>(super.neg(), "negation");
  }

  @operator('+')
  add(b: fp128<Q>): fp128Safe<Q> {
    return check<Q>(super.add(b), "addition");
  }

  @operator('-')
  sub(b: fp128<Q>): fp128Safe<Q> {
    return check<Q>(super.sub(b), "subtraction");
  }

  @operator('*')
  mul(b: fp128<Q>): fp128Safe<Q> {
    return check<Q>(super.mul(b), "multiplication");
  }

  @operator('/')
  div(b: fp128<Q>): fp128Safe<Q> {
    return check<Q>(super.div(b), "division");
  }

  @operator('%')
  rem(b: fp128<Q>): fp128Safe<Q> {
    return check<Q>(super.rem(b), "remainder");
  }

  @operator('**')
  pow(exponent: i32): fp128Safe<Q> {
    return check<Q>(super.pow(exponent), "exponentiation");
  }

  min(b: fp128<Q>): fp128Safe<Q> {
    return new fp128Safe<Q>(super.min(b).value);
  }

  max(b: fp128<Q>): fp128Safe<Q> {
    return new fp128Safe<Q>(super.max(b).value);
  }

  abs(): fp128Safe<Q> {
    return check<Q>(super.abs(), "absolute value");
  }

  sqrt(): fp128Safe<Q> {
    return new fp128Safe<Q>(super.sqrt().value);
  }

  muldiv(b: fp128<Q>, c: fp128<Q>): fp128Safe<Q> {
    return new fp128Safe<Q>(super.muldiv(b, c).value);
  }

  floor(): fp128Safe<Q> {
    return new fp128Safe<Q>(super.floor().value);
  }

  ceil(): fp128Safe<Q> {
    return check<Q>(super.ceil(), "rounding");
  }

  trunc(): fp128Safe<Q> {
    return check<Q>(super.trunc(), "rounding");
  }

  round(): fp128Safe<Q> {
    return check<Q>(super.round(), "rounding");
  }

  frac(): fp128Safe<Q> {
    return new fp128Safe<Q>(super.frac().value);
  }

  /** Same value as an unchecked fp128 */
  @inline
  toUnchecked(): fp128<Q> {
    return new fp128<Q>(this.value.clone());
  }

  clone(): fp128Safe<Q> {
    return new fp128Safe<Q>(this.value.clone());
  }
}
