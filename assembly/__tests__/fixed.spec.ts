import { fp128, fp256, fp128Safe, fp256Safe, u40, u120 } from "../fixed";
import { u128 } from "../integer/u128";
import { i128 } from "../integer/i128";

// Random values are covered by the differential fuzzer (fuzz/run.mjs): these tests
// document the behavior on simple and edge cases.

describe("fp128", () => {
  it("Should know its number of bits", () => {
    expect(fp128.fractBits<u64>()).toBe(64);
    expect(fp128.intBits<u64>()).toBe(64);
    expect(fp128.fractBits<u40>()).toBe(40);
    expect(fp128.fractBits<u120>()).toBe(120);
  });

  it("Should parse and print decimal numbers exactly", () => {
    expect(fp128.fromString<u64>("-12.375").toString()).toStrictEqual(
      "-12.375",
    );
    expect(fp128.fromString<u8>("0.5").toString()).toStrictEqual("0.5");
    // 0.1 isn't a binary fraction: rounded toward zero to a multiple of 2^-16
    expect(fp128.fromString<u16>("0.1").toString()).toStrictEqual(
      "0.0999908447265625",
    );
    expect(fp128.fromString<u64>("2.5").toString(3)).toStrictEqual("2.500");
    expect(fp128.fromString<u64>("-0.25").toString(0)).toStrictEqual("0");
  });

  it("Should add, subtract, multiply and divide", () => {
    var a = fp128.fromString<u64>("-12.375");
    var b = fp128.fromString<u64>("2.5");
    expect((a + b).toString()).toStrictEqual("-9.875");
    expect((a - b).toString()).toStrictEqual("-14.875");
    expect((a * b).toString()).toStrictEqual("-30.9375");
    expect((b / fp128.fromI32<u64>(4)).toString()).toStrictEqual("0.625");
    expect((a % b).toString()).toStrictEqual("-2.375");
  });

  it("Should round", () => {
    var a = fp128.fromString<u64>("-12.5");
    expect(a.floor().toString()).toStrictEqual("-13");
    expect(a.ceil().toString()).toStrictEqual("-12");
    expect(a.trunc().toString()).toStrictEqual("-12");
    expect(a.round().toString()).toStrictEqual("-13");
    expect(a.frac().toString()).toStrictEqual("-0.5");
    expect(a.toI128()).toStrictEqual(i128.fromI32(-12));
  });

  it("Should compute powers and square roots", () => {
    expect((fp128.fromString<u8>("1.5") ** 3).toString()).toStrictEqual(
      "3.375",
    );
    expect((fp128.fromI32<u64>(2) ** -2).toString()).toStrictEqual("0.25");
    expect(fp128.fromI32<u64>(2).sqrt().toString(18)).toStrictEqual(
      "1.414213562373095048",
    );
  });

  it("Should compare", () => {
    var a = fp128.fromString<u64>("1.25");
    var b = fp128.fromString<u64>("-1.25");
    expect(b < a).toBe(true);
    expect(a == fp128.fromF64<u64>(1.25)).toBe(true);
    expect(a.max(b)).toStrictEqual(a);
  });

  it("Should convert to and from floats", () => {
    expect(fp128.fromF64<u64>(-3.75).toF64()).toBe(-3.75);
    expect(fp128.fromF64<u40>(3.14159).toF64()).toBeCloseTo(3.14159);
  });

  it("Should wrap around on overflow", () => {
    expect(fp128.Max<u64>() + fp128.Epsilon<u64>()).toStrictEqual(
      fp128.Min<u64>(),
    );
  });
});

describe("fp256", () => {
  it("Should hold Q128.128 numbers", () => {
    var a = fp256.fromString<u128>("1000000000000000000000000.5");
    expect(a.toString()).toStrictEqual("1000000000000000000000000.5");
    expect((a * fp256.fromI32<u128>(-2)).toString()).toStrictEqual("-2000000000000000000000001");
    // 10^-27 isn't a binary fraction: rounded toward zero to a multiple of 2^-128
    expect(fp256.fromString<u128>("0.000000000000000000000000001").toString(30))
      .toStrictEqual("0.000000000000000000000000000999");
  });

  it("Should muldiv with a full precision product", () => {
    var big = fp256.Max<u64>();
    expect(big.muldiv(big, big)).toStrictEqual(big);
  });
});

describe("Safe fixed point", () => {
  it("Should compute like the unchecked types when nothing overflows", () => {
    var a = fp128Safe.fromString<u64>("1.5");
    expect((a * a).toString()).toStrictEqual("2.25");
    expect((a / fp128Safe.fromI32<u64>(-2)).toString()).toStrictEqual("-0.75");
  });

  it("Should throw on overflow", () => {
    expect(() => {
      !(fp128Safe.Max<u64>() + fp128Safe.Epsilon<u64>());
    }).toThrow();
    expect(() => {
      !(fp128Safe.Max<u64>() * fp128Safe.fromI32<u64>(2));
    }).toThrow();
    expect(() => {
      !-fp256Safe.Min<u128>();
    }).toThrow();
    expect(() => {
      !fp128Safe.fromU128<u64>(u128.Max);
    }).toThrow();
    expect(() => {
      !fp128Safe.fromString<u64>("100000000000000000000");
    }).toThrow();
  });
});

describe("Throwable", () => {
  it("Should throw on division by zero", () => {
    expect(() => {
      !(fp128.One<u64>() / fp128.Zero<u64>());
    }).toThrow();
  });

  it("Should throw on square root of a negative number", () => {
    expect(() => {
      !fp128.fromI32<u64>(-1).sqrt();
    }).toThrow();
  });
});
