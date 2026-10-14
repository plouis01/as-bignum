import { i256 } from "../integer/i256";
import { u256 } from "../integer/u256";
import { i128 } from "../integer/i128";

// Random values are covered by the differential fuzzer (fuzz/run.mjs): these tests
// document the behavior on simple and edge cases.

describe("String Conversion", () => {
  it("Should convert to and from decimal strings", () => {
    expect(
      i256.fromString("-12345678901234567890123456789").toString(),
    ).toStrictEqual("-12345678901234567890123456789");
    expect(i256.Min.toString()).toStrictEqual(
      "-57896044618658097711785492504343953926634992332820282019728792003956564819968",
    );
    expect(i256.Max.toString()).toStrictEqual(
      "57896044618658097711785492504343953926634992332820282019728792003956564819967",
    );
  });

  it("Should convert to and from other radixes", () => {
    expect(i256.fromString("-0xff").toString(16)).toStrictEqual("-ff");
    expect(i256.fromString("101", 2)).toStrictEqual(i256.fromI32(5));
    expect(i256.fromI32(-35).toString(36)).toStrictEqual("-z");
  });
});

describe("Basic Operations", () => {
  it("Should add and subtract across the sign", () => {
    expect(i256.fromI32(-5) + i256.fromI32(3)).toStrictEqual(i256.fromI32(-2));
    expect(i256.fromI32(3) - i256.fromI32(5)).toStrictEqual(i256.fromI32(-2));
    expect(i256.NegOne + i256.One).toStrictEqual(i256.Zero);
  });

  it("Should wrap around on overflow", () => {
    expect(i256.Max + i256.One).toStrictEqual(i256.Min);
    expect(i256.Min - i256.One).toStrictEqual(i256.Max);
    expect(-i256.Min).toStrictEqual(i256.Min);
  });

  it("Should multiply signed numbers", () => {
    expect(i256.fromI32(-7) * i256.fromI32(6)).toStrictEqual(i256.fromI32(-42));
    expect(i256.fromI32(-7) * i256.fromI32(-6)).toStrictEqual(i256.fromI32(42));
  });

  it("Should divide rounding toward zero", () => {
    expect(i256.fromI32(7) / i256.fromI32(2)).toStrictEqual(i256.fromI32(3));
    expect(i256.fromI32(-7) / i256.fromI32(2)).toStrictEqual(i256.fromI32(-3));
    expect(i256.fromI32(7) / i256.fromI32(-2)).toStrictEqual(i256.fromI32(-3));
    expect(i256.fromI32(-7) / i256.fromI32(-2)).toStrictEqual(i256.fromI32(3));
  });

  it("Should give the remainder the sign of the dividend", () => {
    expect(i256.fromI32(-7) % i256.fromI32(2)).toStrictEqual(i256.fromI32(-1));
    expect(i256.fromI32(7) % i256.fromI32(-2)).toStrictEqual(i256.fromI32(1));
  });

  it("Should wrap Min / -1 to Min (Solidity unchecked)", () => {
    expect(i256.Min / i256.NegOne).toStrictEqual(i256.Min);
    expect(i256.Min % i256.NegOne).toStrictEqual(i256.Zero);
  });

  it("Should shift right arithmetically", () => {
    expect(i256.fromI32(-8) >> 1).toStrictEqual(i256.fromI32(-4));
    expect(i256.fromI32(-7) >> 1).toStrictEqual(i256.fromI32(-4)); // rounds toward -infinity
    expect(i256.fromI32(-7) >> 300).toStrictEqual(i256.NegOne);
    expect(i256.fromI32(7) >> 300).toStrictEqual(i256.Zero);
    expect(i256.NegOne >>> 255).toStrictEqual(i256.One);
  });

  it("Should compare signed numbers", () => {
    expect(i256.NegOne < i256.Zero).toBe(true);
    expect(i256.Min < i256.Max).toBe(true);
    expect(i256.ord(i256.Max, i256.Min)).toBe(1);
  });

  it("Should compute powers", () => {
    expect(i256.fromI32(-3) ** 3).toStrictEqual(i256.fromI32(-27));
    expect(i256.fromI32(2) ** 255).toStrictEqual(i256.Min);
    expect(i256.NegOne ** -3).toStrictEqual(i256.NegOne);
  });
});

describe("Math", () => {
  it("Should compute abs, sign and sqrt", () => {
    expect(i256.abs(i256.fromI32(-9))).toStrictEqual(i256.fromI32(9));
    expect(i256.sign(i256.fromI32(-9))).toBe(-1);
    expect(i256.sqrt(i256.fromI32(99))).toStrictEqual(i256.fromI32(9));
  });

  it("Should muldiv with a full precision product", () => {
    // Max * -2 / 4 = -(Max / 2)
    expect(
      i256.muldiv(i256.Max, i256.fromI32(-2), i256.fromI32(4)),
    ).toStrictEqual(-(i256.Max >> 1));
  });
});

describe("Conversions", () => {
  it("Should convert between signed and unsigned", () => {
    expect(i256.NegOne.toU256()).toStrictEqual(u256.Max);
    expect(i256.fromI128(i128.NegOne)).toStrictEqual(i256.NegOne);
    expect(i256.fromI32(-2).toI64()).toBe(-2);
  });

  it("Should convert to and from floats", () => {
    expect(i256.fromF64(-1.5e30).toF64()).toBe(-1.5e30);
    expect(i256.fromF64(-2.9)).toStrictEqual(i256.fromI32(-2));
  });

  it("Should convert to and from bytes", () => {
    var a = i256.fromI32(-2);
    expect(i256.fromBytes(a.toBytes(true), true)).toStrictEqual(a);
  });
});

describe("Throwable", () => {
  it("Should throw on division by zero", () => {
    expect(() => {
      !(i256.One / i256.Zero);
    }).toThrow();
  });

  it("Should throw on square root of a negative number", () => {
    expect(() => {
      !i256.sqrt(i256.NegOne);
    }).toThrow();
  });

  it("Should throw when the muldiv result doesn't fit", () => {
    expect(() => {
      !i256.muldiv(i256.Max, i256.Max, i256.One);
    }).toThrow();
  });
});
