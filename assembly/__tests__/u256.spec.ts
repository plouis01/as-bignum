import { u128 } from '../integer/u128';
import { u256 } from '../integer/u256';

describe("String Conversion", () => {
  it("Should convert to decimal string 1", () => {
    var a = new u256(10248516654965971928, 5, 0, 0);
    expect('102482237023513730008').toStrictEqual(a.toString());
  });

  it("Should convert to decimal string 2", () => {
    var a = new u256(1, 1, 1, 1);
    expect('6277101735386680764176071790128604879584176795969512275969')
      .toStrictEqual(a.toString());
  });

  it("Should convert to decimal string 3", () => {
    var a = u256.Max;
    expect('115792089237316195423570985008687907853269984665640564039457584007913129639935')
      .toStrictEqual(a.toString());
  });

  it("Should convert to decimal string 4", () => {
    var a = u256.Zero;
    expect('0').toStrictEqual(a.toString());
  });
});

describe("Buffer Conversion", () => {
  it("Should convert from bytes Little Endian 1", () => {
    var arr: u8[] = [
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12,
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12
    ];
    expect(u256.fromBytes(arr))
      .toStrictEqual(new u256(
        0x8877665544332211,
        0x12FFEEDDCCBBAA99,
        0x8877665544332211,
        0x12FFEEDDCCBBAA99
      ));
  });

  it("Should convert from bytes Little Endian 2", () => {
    var arr: u8[] = [
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12,
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12
    ];

    expect(u256.fromBytes(arr))
      .toStrictEqual(new u256(
        0x8877665544332211,
        0x12FFEEDDCCBBAA99,
        0x8877665544332211,
        0x12FFEEDDCCBBAA99
      ));
  });

  it("Should convert from bytes Big Endian 1", () => {
    var arr: u8[] = [
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12,
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12
    ];

    expect(u256.fromBytes(arr, true))
      .toStrictEqual(new u256(
        0x99AABBCCDDEEFF12,
        0x1122334455667788,
        0x99AABBCCDDEEFF12,
        0x1122334455667788
      ));
  });

  it("Should convert from bytes Big Endian 2", () => {
    var arr: u8[] = [
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12,
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x12
    ];

    expect(u256.fromBytes(arr, true))
      .toStrictEqual(new u256(
        0x99AABBCCDDEEFF12,
        0x1122334455667788,
        0x99AABBCCDDEEFF12,
        0x1122334455667788
      ));
  });

  it("Should convert to bytes Litte Endian 1", () => {
    var u = new u256(
      0x8877665544332211,
      0x12FFEEDDCCBBAA99,
      0x8877665544332211,
      0x12FFEEDDCCBBAA99
    );
    let a = u.toBytes();
    expect(
      a[0]  == 0x11 && a[1]  == 0x22 && a[2]  == 0x33 && a[3]  == 0x44 &&
      a[4]  == 0x55 && a[5]  == 0x66 && a[6]  == 0x77 && a[7]  == 0x88 &&
      a[8]  == 0x99 && a[9]  == 0xAA && a[10] == 0xBB && a[11] == 0xCC &&
      a[12] == 0xDD && a[13] == 0xEE && a[14] == 0xFF && a[15] == 0x12 &&
      a[16] == 0x11 && a[17] == 0x22 && a[18] == 0x33 && a[19] == 0x44 &&
      a[20] == 0x55 && a[21] == 0x66 && a[22] == 0x77 && a[23] == 0x88 &&
      a[24] == 0x99 && a[25] == 0xAA && a[26] == 0xBB && a[27] == 0xCC &&
      a[28] == 0xDD && a[29] == 0xEE && a[30] == 0xFF && a[31] == 0x12
    ).toBe(true);

    {
      let a = u.toStaticBytes();
      expect(
        a[0]  == 0x11 && a[1]  == 0x22 && a[2]  == 0x33 && a[3]  == 0x44 &&
        a[4]  == 0x55 && a[5]  == 0x66 && a[6]  == 0x77 && a[7]  == 0x88 &&
        a[8]  == 0x99 && a[9]  == 0xAA && a[10] == 0xBB && a[11] == 0xCC &&
        a[12] == 0xDD && a[13] == 0xEE && a[14] == 0xFF && a[15] == 0x12 &&
        a[16] == 0x11 && a[17] == 0x22 && a[18] == 0x33 && a[19] == 0x44 &&
        a[20] == 0x55 && a[21] == 0x66 && a[22] == 0x77 && a[23] == 0x88 &&
        a[24] == 0x99 && a[25] == 0xAA && a[26] == 0xBB && a[27] == 0xCC &&
        a[28] == 0xDD && a[29] == 0xEE && a[30] == 0xFF && a[31] == 0x12
      ).toBe(true);
    }
  });

  it("Should convert to bytes Litte Endian 2", () => {
    var u = new u256(
      0x8877665544332211,
      0x12FFEEDDCCBBAA99,
      0x8877665544332211,
      0x12FFEEDDCCBBAA99
    );
    var a = u.toUint8Array();
    expect(
      a[0]  == 0x11 && a[1]  == 0x22 && a[2]  == 0x33 && a[3]  == 0x44 &&
      a[4]  == 0x55 && a[5]  == 0x66 && a[6]  == 0x77 && a[7]  == 0x88 &&
      a[8]  == 0x99 && a[9]  == 0xAA && a[10] == 0xBB && a[11] == 0xCC &&
      a[12] == 0xDD && a[13] == 0xEE && a[14] == 0xFF && a[15] == 0x12 &&
      a[16] == 0x11 && a[17] == 0x22 && a[18] == 0x33 && a[19] == 0x44 &&
      a[20] == 0x55 && a[21] == 0x66 && a[22] == 0x77 && a[23] == 0x88 &&
      a[24] == 0x99 && a[25] == 0xAA && a[26] == 0xBB && a[27] == 0xCC &&
      a[28] == 0xDD && a[29] == 0xEE && a[30] == 0xFF && a[31] == 0x12
    ).toBe(true);
  });

  it("Should convert to bytes Big Endian 1", () => {
    var u = new u256(
      0x99AABBCCDDEEFF12,
      0x1122334455667788,
      0x99AABBCCDDEEFF12,
      0x1122334455667788
    );
    var a = u.toBytes(true);
    expect(
      a[0]  == 0x11 && a[1]  == 0x22 && a[2]  == 0x33 && a[3]  == 0x44 &&
      a[4]  == 0x55 && a[5]  == 0x66 && a[6]  == 0x77 && a[7]  == 0x88 &&
      a[8]  == 0x99 && a[9]  == 0xAA && a[10] == 0xBB && a[11] == 0xCC &&
      a[12] == 0xDD && a[13] == 0xEE && a[14] == 0xFF && a[15] == 0x12 &&
      a[16] == 0x11 && a[17] == 0x22 && a[18] == 0x33 && a[19] == 0x44 &&
      a[20] == 0x55 && a[21] == 0x66 && a[22] == 0x77 && a[23] == 0x88 &&
      a[24] == 0x99 && a[25] == 0xAA && a[26] == 0xBB && a[27] == 0xCC &&
      a[28] == 0xDD && a[29] == 0xEE && a[30] == 0xFF && a[31] == 0x12
    ).toBe(true);
  });

  it("Should convert to bytes Big Endian 2", () => {
    var u = new u256(
      0x99AABBCCDDEEFF12,
      0x1122334455667788,
      0x99AABBCCDDEEFF12,
      0x1122334455667788
    );
    var a = u.toUint8Array(true);
    expect(
      a[0]  == 0x11 && a[1]  == 0x22 && a[2]  == 0x33 && a[3]  == 0x44 &&
      a[4]  == 0x55 && a[5]  == 0x66 && a[6]  == 0x77 && a[7]  == 0x88 &&
      a[8]  == 0x99 && a[9]  == 0xAA && a[10] == 0xBB && a[11] == 0xCC &&
      a[12] == 0xDD && a[13] == 0xEE && a[14] == 0xFF && a[15] == 0x12 &&
      a[16] == 0x11 && a[17] == 0x22 && a[18] == 0x33 && a[19] == 0x44 &&
      a[20] == 0x55 && a[21] == 0x66 && a[22] == 0x77 && a[23] == 0x88 &&
      a[24] == 0x99 && a[25] == 0xAA && a[26] == 0xBB && a[27] == 0xCC &&
      a[28] == 0xDD && a[29] == 0xEE && a[30] == 0xFF && a[31] == 0x12
    ).toBe(true);
  });
});

describe("Basic Operations", () => {
  it("Should number is zero 1", () => {
    var a = u256.Zero;
    expect(a.isZero()).toBe(true);
  });

  it("Should number is zero 2", () => {
    var a = u256.One;
    expect(!a.isZero()).toBe(true);
  });

  it("Should number binary not", () => {
    var a = new u256(1, 2, 3, 4);
    expect(~a).toStrictEqual(new u256(~1, ~2, ~3, ~4));
  });

  it("Should number unary positive", () => {
    var a = new u256(1, 2, 3, 4);
    expect(+a).toStrictEqual(a);
  });

  it("Should number unary negative zero equal to zero", () => {
    var a = u256.Zero;
    expect(-a).toStrictEqual(u256.Zero);
  });

  it("Should number unary negative one equal to max", () => {
    var a = u256.One;
    expect(-a).toStrictEqual(u256.Max);
  });

  it("Should number unary negative max equal to one", () => {
    var a = u256.Max;
    expect(-a).toStrictEqual(u256.One);
  });

  it("Should number unary negative [max, 0, max, 0] equal to [1, max, 0, max]", () => {
    var a = new u256(u64.MAX_VALUE, 0, u64.MAX_VALUE, 0);
    expect(-a).toStrictEqual(new u256(1, u64.MAX_VALUE, 0, u64.MAX_VALUE));
  });

  it("Should number non empty", () => {
    var a = u256.One;
    expect(!!a).toBe(true);
  });

  it("Should number is empty 1", () => {
    var a = u256.Zero;
    expect(!a).toBe(true);
  });

  it("Should binary or numbers", () => {
    var a = new u256(1, 3, 0, 4);
    var b = new u256(2, 4, 3, 3);
    var r = new u256(1 | 2, 3 | 4, 0 | 3, 4 | 3);
    expect(a | b).toStrictEqual(r);
    expect(b | a).toStrictEqual(r);
  });

  it("Should binary xor numbers", () => {
    var a = new u256(1, 3, 0, 4);
    var b = new u256(2, 4, 3, 3);
    var r = new u256(1 ^ 2, 3 ^ 4, 0 ^ 3, 4 ^ 3);
    expect(a ^ b).toStrictEqual(r);
    expect(b ^ a).toStrictEqual(r);
  });

  it("Should binary and numbers", () => {
    var a = new u256(1, 3, 0, 4);
    var b = new u256(2, 4, 3, 3);
    var r = new u256(1 & 2, 3 & 4, 0 & 3, 4 & 3);
    expect(a & b).toStrictEqual(r);
    expect(b & a).toStrictEqual(r);
  });

  it("Should add [1, 0, 0, 0] and [max, 0, 0, 0]", () => {
    var a = u256.One;
    var b = new u256(u64.MAX_VALUE, 0, 0, 0);
    var r = new u256(0, 1, 0, 0);
    expect(a + b).toStrictEqual(r);
    expect(b + a).toStrictEqual(r);
  });

  it("Should add [1, 0, 0, 0] and [max, max, 0, 0]", () => {
    var a = u256.One;
    var b = new u256(u64.MAX_VALUE, u64.MAX_VALUE, 0, 0);
    var r = new u256(0, 0, 1, 0);
    expect(a + b).toStrictEqual(r);
    expect(b + a).toStrictEqual(r);
  });

  it("Should add [1, 0, 0, 0] and [max, max, max, 0]", () => {
    var a = u256.One;
    var b = new u256(u64.MAX_VALUE, u64.MAX_VALUE, u64.MAX_VALUE, 0);
    var r = new u256(0, 0, 0, 1);
    expect(a + b).toStrictEqual(r);
    expect(b + a).toStrictEqual(r);
  });

  it("Should add [1, 1, 1, 1] and [max - 1, max - 1, max - 1, max - 1]", () => {
    const one: u64 = 1;
    const pre = u64.MAX_VALUE - 1;
    var a = new u256(one, one, one, one);
    var b = new u256(pre, pre, pre, pre);
    var r = u256.Max;
    expect(a + b).toStrictEqual(r);
    expect(b + a).toStrictEqual(r);
  });

  it("Should sub one minus one", () => {
    var a = u256.One;
    var b = a;
    var r = u256.Zero
    expect(a - b).toStrictEqual(r);
  });

  it("Should sub [2, 2, 2, 2] and [1, 1, 1, 1]", () => {
    var a = new u256(2, 2, 2, 2);
    var b = new u256(1, 1, 1, 1);
    var r = b;
    expect(a - b).toStrictEqual(r);
  });

  it("Should sub [max, max, max, max] and [1, 2, 3, 4]", () => {
    const max = u64.MAX_VALUE;
    var a = u256.Max;
    var b = new u256(1, 2, 3, 4);
    var r = new u256(max - 1, max - 2, max - 3, max - 4);
    expect(a - b).toStrictEqual(r);
  });

  it("Should sub [0, 0, 0, 0] and [1, 1, 1, 1]", () => {
    const max = u64.MAX_VALUE;
    var a = u256.Zero;
    var b = new u256(1, 1, 1, 1);
    var r = new u256(max, max - 1, max - 1, max - 1);
    expect(a - b).toStrictEqual(r);
  });

  it("Should sub [0, 0, 0, 0] and [max, max, max, max]", () => {
    var a = u256.Zero;
    var b = u256.Max;
    var r = u256.One;
    expect(a - b).toStrictEqual(r);
  });

  it("Should sub [max, max, max, max] and [1, 0, 0, 0]", () => {
    const max = u64.MAX_VALUE;
    var a = u256.Max;
    var b = u256.One;
    var r = new u256(max - 1, max, max, max);
    expect(a - b).toStrictEqual(r);
  });

  it("Should sub [1, 2, 3, 4] and [max - 1, max - 2, max - 3, max - 4]", () => {
    const max = u64.MAX_VALUE;
    var a = new u256(1, 2, 3, 4);
    var b = new u256(max - 1, max - 2, max - 3, max - 4);
    var r = new u256(3, 4, 6, 8);
    expect(a - b).toStrictEqual(r);
  });

  it("Should left shift one number", () => {
    var b = new u256(1, 0, 0, 0);
    var a = new u256(0, 0, 0, 1)
    // log(a.toString())
    // log(b.toString())
    expect(a << 193).toStrictEqual(b);
  });

  it("Should periodic left shift one number", () => {
    var b = new u256(1, 0, 0, 0);
    var a = new u256(0, 0, 0, 1)
    expect(a << (193 + 256)).toStrictEqual(b);
  });

  it("Should invariant left shift zero number", () => {
    var a = new u256(1, 1, 1, 1);
    expect(a << 0).toStrictEqual(a);
  });

  it("Should right shift one number", () => {
    var b = new u256(0, 0, 0, 1);
    var a = new u256(1, 0, 0, 0)
    expect(a >> 193).toStrictEqual(b);
  });

  it("Should periodic right shift one number", () => {
    var b = new u256(0, 0, 0, 1);
    var a = new u256(1, 0, 0, 0);
    expect(a >> (193 + 256)).toStrictEqual(b);
  });

  it("Should invariant right shift zero number", () => {
    var a = new u256(1, 1, 1, 1);
    expect(a >> 0).toStrictEqual(a);
  });

  it("Should multiply two u256 numbers", () => {
    var a = u256.from(3);
    var b = u256.from(3);
    var r = u256.from(9);

    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply two u256 numbers", () => {
    var a = u256.from(43545453452);
    var b = u256.from(2353454354);
    var r = new u256(10248516654965971928, 5);

    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply two u256 numbers - 2", () => {
    var a = u256.from(11);
    var b = new u256(0, 2);
    var r = new u256(0, 22);

    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply two u256 numbers - 3", () => {
    var a = new u256(0, 3);
    var b = new u256(0, 0,3);
    var r = new u256(0, 0,0,9);

    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply two u256 numbers - 4", () => {
    var a = u256.from(new u128(14083847773837265618, 6692605942));
    var b = u256.from(new u128(18444665141527514289, 5354084802));
    var r = new u256(5659639222556316466, 4474720309748468391, 17386035696907167262, 1);

    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply u256 numbers by 1", () => {
    var a = u256.Max;
    var b = u256.One;
    var r = a;
    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply u256 numbers by 0", () => {
    var a = new u256(5656466, 447478468391, 17386907167262, 1);
    var b = u256.Zero;
    var r = b;
    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply two u256 numbers with overflow", () => {
    var a = new u256(0, 0, 1);
    expect(a * a).toStrictEqual(u256.Zero);
  });

  it("Should multiply two u256 numbers with overflow - 2", () => {
    var a = new u256(1, 0, 1);
    expect(a * a).toStrictEqual(new u256(1, 0, 2));
  });

  it("Should multiply two u256 numbers with overflow - 3", () => {
    var a = new u256(6, 0, 0, 420);
    var b = new u256(0, 7, 0, 0);
    var r = new u256(0, 42, 0, 0);

    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should multiply two u256 numbers with overflow - 3", () => {
    var a = new u256(2, 666, 666, 666);
    var b = new u256(0, 0, 0, 3);
    var r = new u256(0, 0, 0, 6);

    expect(a * b).toStrictEqual(r);
    expect(b * a).toStrictEqual(r);
  });

  it("Should divide u256 numbers", () => {
    var a = u256.from(3);
    var b = u256.from(9);

    expect(b / a).toStrictEqual(a);
  });

  it("Should divide two u256 numbers", () => {
    var a = u256.from(43545453452);
    var b = u256.from(2353454354);
    var n = new u256(10248516654965971928, 5);

    expect(n / b).toStrictEqual(a);
    expect(n / a).toStrictEqual(b);
  });

  it("Should divide two u256 numbers - 2", () => {
    var a = u256.from(11);
    var b = new u256(0, 2);
    var n = new u256(0, 22);

    expect(n / b).toStrictEqual(a);
    expect(n / a).toStrictEqual(b);
  });

  it("Should divide two u256 numbers - 3", () => {
    var a = new u256(0, 3);
    var b = new u256(0, 0,3);
    var n = new u256(0, 0,0,9);

    expect(n / b).toStrictEqual(a);
    expect(n / a).toStrictEqual(b);
  });

  it("Should divide two u256 numbers - 4", () => {
    var a = u256.from(new u128(14083847773837265618, 6692605942));
    var b = u256.from(new u128(18444665141527514289, 5354084802));
    var n = new u256(5659639222556316466, 4474720309748468391, 17386035696907167262, 1);

    expect(n / b).toStrictEqual(a);
    expect(n / a).toStrictEqual(b);
  });

  it("Should divide u256 numbers by 1", () => {
    var a = u256.Max;
    var b = u256.One;
    var r = a;

    expect(a / b).toStrictEqual(r);
  });

  it("Should divide u256 numbers by 0", () => {
    var a = new u256(5656466, 447478468391, 17386907167262, 1);
    var b = u256.Zero;
    var r = b;
    expect(a / b).toStrictEqual(r);
    expect(b / a).toStrictEqual(r);
  });

  it("Should divide two equal u256 numbers", () => {
    var a = new u256(0, 0, 1);
    var b = u256.One;

    expect(a / a).toStrictEqual(b);
  });

  it("Should divide two u256 numbers with d<a<b", () => {
    var a = u256.from(43545453452);
    var b = new u256(10248516654965971928, 5);
    var d = u256.from(2353454354);
    var r = u256.Zero;

    expect(d / b).toStrictEqual(r);
    expect(d / a).toStrictEqual(r);
  });

  it("Should divide two numbers without remainder 1", () => {
    let a = new u256(10248516657319426282, 5);
    let b = u256.from(2353454354);
    expect(a / b).toStrictEqual(u256.from(43545453453));
  });

  it("Should divide two numbers without remainder 2", () => {
    let a = new u256(10248516654965971928, 5);
    let b = u256.from(43545453452);
    expect(a / b).toStrictEqual(u256.from(2353454354));
  });

  it("Should divide two numbers without remainder 3", () => {
    let a = new u256(3152652666208173568, 2);
    let b = u256.from(4354545345312);
    expect(a / b).toStrictEqual(u256.from(9196400));
  });

  it("Should divide two numbers without remainder 4", () => {
    let a = u256.from(u128.from('9801427805542018869750100000000'));
    let b = u256.from(10);
    expect(a / b).toStrictEqual(u256.from(u128.from('980142780554201886975010000000')));
  });

  it("Should divide two numbers with remainder 1", () => {
    let a = new u256(3152652666208173568, 2);
    let b = u256.from(43543534534534);
    expect(a / b).toStrictEqual(u256.from(919680));
  });

  it("Should divide two numbers with remainder 2", () => {
    let a = new u256(3152652666208178,0);
    let b = u256.from(43543534534534);
    expect(a / b).toStrictEqual(u256.from(72));
  });

  it("Should divide zero with number", () => {
    let a = u256.Zero;
    let b = new u256(10248516654965971928, 5);
    expect(a / b).toStrictEqual(u256.Zero);
  });

  it("Should divide number with one", () => {
    let a = new u256(10248516654965971928, 5);
    let b = u256.One;
    expect(a / b).toStrictEqual(a);
  });

  it("Should mod two numbers without remainder", () => {
    let a = u256.from(u128.from('9801427805542018869750100000000'));
    let b = u256.from(10);
    expect(a % b).toStrictEqual(u256.Zero);
  });

  it("Should mod two numbers without remainder 2", () => {
    let a = new u256(10248516654965971928, 5);
    let b = u256.from(43545453452);
    expect(a % b).toStrictEqual(u256.Zero);
  });

  it("Should mod two numbers with remainder 1", () => {
    let a = new u256(3152652666208173568, 2);
    let b = u256.from(43543534534534);
    expect(a % b).toStrictEqual(u256.from(22972907047680));
  });

  it("Should mod two numbers with remainder 2", () => {
    let a = new u256(3152652666208178);
    let b = u256.from(43543534534534);
    expect(a % b).toStrictEqual(u256.from(17518179721730));
  });

  it("Should mod two numbers with remainder 3", () => {
    let a = new u256(987775983032474055, 5421010862427527591, 2);
    let b = new u256(43543534534534);
    expect(a % b).toStrictEqual(new u256(33195245235237));
  });

  it("Should mod number with one", () => {
    let a = new u256(10248516654965971928, 5);
    let b = u256.One;
    expect(a % b).toStrictEqual(u256.Zero);
  });

  it("Should mod number with two", () => {
    let a = u256.from(u128.from('9801427805542018869750100000001'));
    let b = u256.from(2);
    expect(a % b).toStrictEqual(u256.One);
  });

  it("Should mod number with four", () => {
    let a = u256.from(u128.from('1427864420188697501000003'));
    let b = u256.from(4);
    expect(a % b).toStrictEqual(new u256(3));
  });

  it("Should mod number with 128", () => {
    let a = u256.from(4);
    let b = u256.from(128);
    expect(a % b).toStrictEqual(a);
  });

  it("Should mod number with 256", () => {
    let a = u256.from(41);
    let b = u256.from(256);
    expect(a % b).toStrictEqual(a);
  });

  it("Should mod number same number 1", () => {
    let a = u256.from(8);
    let b = u256.from(8);
    expect(a % b).toStrictEqual(u256.Zero);
  });

  it("Should mod number same number 2", () => {
    let a = new u256(10248516654965971928, 5, 2, 100);
    expect(a % a).toStrictEqual(u256.Zero);
  });

  it("Should divide two same numbers", () => {
    let a = new u256(10248516654965971928, 5, 6, 8);
    expect(a / a).toStrictEqual(u256.One);
  });

  it("Should mod number same max value", () => {
    let a = u256.Max;
    expect(a % a).toStrictEqual(u256.Zero);
  });

  it("Should div number same max value", () => {
    let a = u256.Max;
    expect(a / a).toStrictEqual(u256.One);
  });
});
