[![NPM registry](https://img.shields.io/npm/v/as-bignum.svg?style=for-the-badge)](https://www.npmjs.com/package/as-bignum)[![Build Status](https://img.shields.io/travis/com/MaxGraey/as-bignum/master?style=for-the-badge)](https://travis-ci.com/MaxGraey/as-bignum)[![NPM license](https://img.shields.io/badge/license-Apache%202.0-ba68c8.svg?style=for-the-badge)](LICENSE.md)

## WebAssembly fixed length big numbers written on [AssemblyScript](https://github.com/AssemblyScript/assemblyscript)

Provide wide numeric types such as `u128`, `u256`, `i128`, `i256` and fixed points and also its arithmetic operations.

The `Safe` types (`u128Safe`, `i256Safe`, `fp128Safe<Q>`...) are equivalents with overflow/underflow traps.

All kind of types pretty useful for economical and cryptographic usages and provide deterministic behavior.

### Install

> yarn add as-bignum

or

> npm i as-bignum

### Usage via AssemblyScript

```ts
import { u128 } from "as-bignum/assembly";
// Before 0.20.x
// import { u128 } from "as-bignum";

declare function logF64(value: f64): void;
declare function logU128(hi: u64, lo: u64): void;

var a = u128.One;
var b = u128.from(-32); // same as u128.from<i32>(-32)
var c = new u128(0x1, -0xF);
var d = u128.from(0x0123456789ABCDEF); // same as u128.from<i64>(0x0123456789ABCDEF)
var e = u128.from('0x0123456789ABCDEF01234567');
var f = u128.fromString('11100010101100101', 2); // same as u128.from('0b11100010101100101')
var r = d / c + (b << 5) + e;

logF64(r.as<f64>());
logU128(r.hi, r.lo);
```

### Usage via JavaScript/Typescript

```ts
TODO
```

### List of types

| Type | Description |
| --- | --- |
| [`u128`](assembly/integer/u128.ts), [`u256`](assembly/integer/u256.ts) | unsigned integers |
| [`i128`](assembly/integer/i128.ts), [`i256`](assembly/integer/i256.ts) | signed integers (two's complement) |
| [`u128Safe`](assembly/integer/safe/u128.ts), [`u256Safe`](assembly/integer/safe/u256.ts), [`i128Safe`](assembly/integer/safe/i128.ts), [`i256Safe`](assembly/integer/safe/i256.ts) | the same with checked arithmetic |
| [`fp128<Q>`](assembly/fixed/fp128.ts), [`fp256<Q>`](assembly/fixed/fp256.ts) | signed binary fixed point٭ |
| [`fp128Safe<Q>`](assembly/fixed/safe/fp128.ts), [`fp256Safe<Q>`](assembly/fixed/safe/fp256.ts) | the same with checked arithmetic٭ |

٭ _typename_ `Q` _gives the number of fractional bits: `u8`, `u16`, `u32`, `u64`, `u128` or a tag from [`types.ts`](assembly/fixed/types.ts) (`u24`, `u40`... `u192`). `fp128<u64>` is a Q63.64 number, `fp256<u128>` a Q128.128 one. Aliases such as `fp128x64` are exported for type annotations._

### Integer operations

All integer types support:

- operators `+ - * / % ** << >> >>> & | ^ ~ ! == != < <= > >= ++ --` and unary `-`
- `min`, `max`, `ord`, `sqrt` (rounded down), `muldiv` (`a * b / c` with a full precision intermediate product, like OpenZeppelin's `Math.mulDiv`), `popcnt`, `clz`, `ctz`
- unsigned types: `muldivUp`, `mulmod`, `addmod` (like Solidity's), `rotl`, `rotr`
- signed types: `abs`, `absU` (exact unsigned absolute value), `sign`
- conversions from and to every builtin type, the other wide types, floats (`fromF64` truncates, `toF64` rounds to nearest), bytes (little or big endian) and strings in any radix from 2 to 36 (`fromString` accepts the `0x`, `0o` and `0b` prefixes)

### Semantics

The arithmetic follows Solidity (>= 0.8):

| | unchecked types (`u256`...) | checked types (`u256Safe`...) |
| --- | --- | --- |
| `+ - * ** ++ --`, unary `-` | wrap around | throw on overflow |
| `/`, `%` | throw on division by zero, round toward zero, `Min / -1` wraps to `Min` | same, `Min / -1` throws |
| `<<`, `>>`, `>>>` | not checked; shifting by the bit width or more gives `0` (`-1` for a negative `>>`) | same |
| `muldiv`, `mulmod`, `addmod` | throw on division by zero, `muldiv` throws when the result doesn't fit | same |
| conversions (`toI64`, `fromI256`...) | keep the low bits (like explicit conversions) | same |

`>>` is an arithmetic shift for signed types (it rounds toward negative infinity) and `>>>` a logical one.

### Fixed point

```ts
import { fp128, fp256Safe } from "as-bignum/assembly";

var a = fp128.fromString<u64>("-12.375");   // Q63.64
var b = fp128.fromI32<u64>(2);
var c = (a * a + b).sqrt();
c.toString(6);   // "12.455545" (6 decimals, truncated)

var rate = fp256Safe.fromString<u128>("1.0005");  // Q128.128, checked
var r = rate ** 100;   // would throw on overflow instead of wrapping
r.toString();          // exact decimal value
r.toF64();             // 1.0512579599480492
```

Static functions take the fractional bits as a type argument (`fp128.Max<u64>()`, `fp128.fromF64<u40>(x)`), operations are methods (`x.sqrt()`, `x.floor()`, `x.ceil()`, `x.round()`, `x.trunc()`, `x.frac()`, `x.abs()`, `x.min(y)`, `x.muldiv(y, z)`...). Multiplication, division, parsing and conversions round toward zero; the raw value is `x.value`.

`assembly/fixed/fp256.ts` is generated from `fp128.ts` (`yarn generate`).

### Tests

```
yarn test        # unit tests (as-pect)
yarn test:fuzz   # differential fuzzing of every type and operation against JavaScript BigInt
```
