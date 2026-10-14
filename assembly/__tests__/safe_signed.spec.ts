import { i128Safe } from "../integer/safe/i128";
import { i256Safe } from "../integer/safe/i256";
import { u256Safe } from "../integer/safe/u256";

// Checked types throw where Solidity >= 0.8 reverts. Random values are covered by the
// differential fuzzer (fuzz/run.mjs).

describe("i128Safe", () => {
  it("Should compute like i128 when nothing overflows", () => {
    expect(i128Safe.fromI32(-7) * i128Safe.fromI32(6)).toStrictEqual(
      i128Safe.fromI32(-42),
    );
    expect(i128Safe.fromI32(-7) / i128Safe.fromI32(2)).toStrictEqual(
      i128Safe.fromI32(-3),
    );
    expect(i128Safe.Min + i128Safe.Max).toStrictEqual(i128Safe.NegOne);
    expect(i128Safe.fromI32(-2) ** 127).toStrictEqual(i128Safe.Min);
  });

  it("Should throw on overflow", () => {
    expect(() => {
      !(i128Safe.Max + i128Safe.One);
    }).toThrow();
    expect(() => {
      !(i128Safe.Min - i128Safe.One);
    }).toThrow();
    expect(() => {
      !(i128Safe.Max * i128Safe.fromI32(2));
    }).toThrow();
    expect(() => {
      !(i128Safe.fromI32(2) ** 127);
    }).toThrow();
  });

  it("Should throw on Min / -1, -Min and abs(Min)", () => {
    expect(() => {
      !(i128Safe.Min / i128Safe.NegOne);
    }).toThrow();
    expect(() => {
      !-i128Safe.Min;
    }).toThrow();
    expect(() => {
      !i128Safe.abs(i128Safe.Min);
    }).toThrow();
  });

  it("Should throw when incrementing Max or decrementing Min", () => {
    expect(() => {
      let a = i128Safe.Max;
      ++a;
    }).toThrow();
    expect(() => {
      let a = i128Safe.Min;
      --a;
    }).toThrow();
  });
});

describe("i256Safe", () => {
  it("Should compute like i256 when nothing overflows", () => {
    expect(i256Safe.fromI32(-7) * i256Safe.fromI32(6)).toStrictEqual(
      i256Safe.fromI32(-42),
    );
    expect(i256Safe.fromI32(-2) ** 255).toStrictEqual(i256Safe.Min);
    expect(i256Safe.Min % i256Safe.NegOne).toStrictEqual(i256Safe.Zero);
  });

  it("Should throw on overflow", () => {
    expect(() => {
      !(i256Safe.Max + i256Safe.One);
    }).toThrow();
    expect(() => {
      !(i256Safe.Min - i256Safe.One);
    }).toThrow();
    expect(() => {
      !(i256Safe.Min * i256Safe.NegOne);
    }).toThrow();
    expect(() => {
      !(i256Safe.fromI32(2) ** 255);
    }).toThrow();
  });

  it("Should throw on Min / -1 and -Min", () => {
    expect(() => {
      !(i256Safe.Min / i256Safe.NegOne);
    }).toThrow();
    expect(() => {
      !-i256Safe.Min;
    }).toThrow();
  });
});

describe("u256Safe", () => {
  it("Should multiply, divide and raise to a power without overflow", () => {
    var a = u256Safe.fromU64(u64.MAX_VALUE);
    expect((a * a) / a).toStrictEqual(a);
    expect(u256Safe.fromU32(2) ** 255).toStrictEqual(
      new u256Safe(0, 0, 0, 0x8000000000000000),
    );
  });

  it("Should throw on overflow and underflow", () => {
    expect(() => {
      !(u256Safe.Max * u256Safe.fromU32(2));
    }).toThrow();
    expect(() => {
      !(u256Safe.fromU32(2) ** 256);
    }).toThrow();
    expect(() => {
      !-u256Safe.One;
    }).toThrow();
    expect(() => {
      let a = u256Safe.Zero;
      --a;
    }).toThrow();
  });
});
