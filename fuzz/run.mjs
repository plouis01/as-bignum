// Differential fuzzing of the integer types against JavaScript BigInt.
//
// Generates an AssemblyScript harness with one entry point per type, compiles it, then
// runs every operation on random and edge-case operands and compares the result (or the
// exception) with a BigInt reference implementing Solidity's semantics:
//  - plain types wrap around on overflow, safe types throw;
//  - division and remainder by zero always throw, division rounds toward zero;
//  - shifting by the bit width or more gives 0 (-1 for a negative signed `>>`).
//
// Usage: node fuzz/run.mjs [iterations per operation, default 3000] [seed]

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "build", "fuzz");
const ITERATIONS = Number(process.argv[2] ?? 3000);
let seed = BigInt(process.argv[3] ?? Date.now());

// ---------------------------------------------------------------------------------------
// types and operations

const ALL_TYPES = [
  { name: "u128",     bits: 128, signed: false, safe: false, module: "integer" },
  { name: "i128",     bits: 128, signed: true,  safe: false, module: "integer" },
  { name: "u256",     bits: 256, signed: false, safe: false, module: "integer" },
  { name: "i256",     bits: 256, signed: true,  safe: false, module: "integer" },
  { name: "u128Safe", bits: 128, signed: false, safe: true,  module: "integer/safe" },
  { name: "i128Safe", bits: 128, signed: true,  safe: true,  module: "integer/safe" },
  { name: "u256Safe", bits: 256, signed: false, safe: true,  module: "integer/safe" },
  { name: "i256Safe", bits: 256, signed: true,  safe: true,  module: "integer/safe" },
];
// FUZZ_TYPES=u128,i256 restricts the run to some types
const TYPES = process.env.FUZZ_TYPES
  ? ALL_TYPES.filter((t) => process.env.FUZZ_TYPES.split(",").includes(t.name))
  : ALL_TYPES;

// kind of result: v = number of the tested type, i = i32, f = f64, s = string
// `only`: "u" for unsigned types only, "s" for signed types only
const OPS = [
  { name: "add",     res: "v", code: "st(a + b)" },
  { name: "sub",     res: "v", code: "st(a - b)" },
  { name: "mul",     res: "v", code: "st(a * b)" },
  { name: "div",     res: "v", code: "st(a / b)" },
  { name: "rem",     res: "v", code: "st(a % b)" },
  { name: "pow",     res: "v", code: "st(a ** n)" },
  { name: "shl",     res: "v", code: "st(a << n)" },
  { name: "shr",     res: "v", code: "st(a >> n)" },
  { name: "shr_u",   res: "v", code: "st(a >>> n)" },
  { name: "and",     res: "v", code: "st(a & b)" },
  { name: "or",      res: "v", code: "st(a | b)" },
  { name: "xor",     res: "v", code: "st(a ^ b)" },
  { name: "not",     res: "v", code: "st(~a)" },
  { name: "neg",     res: "v", code: "st(-a)" },
  { name: "preInc",  res: "v", code: "st(++a)" },
  { name: "preDec",  res: "v", code: "st(--a)" },
  { name: "postInc", res: "v", code: "let t = a++; assert(t == b); st(a)" },
  { name: "eq",      res: "i", code: "ri(i32(a == b))" },
  { name: "ne",      res: "i", code: "ri(i32(a != b))" },
  { name: "lt",      res: "i", code: "ri(i32(a < b))" },
  { name: "le",      res: "i", code: "ri(i32(a <= b))" },
  { name: "gt",      res: "i", code: "ri(i32(a > b))" },
  { name: "ge",      res: "i", code: "ri(i32(a >= b))" },
  { name: "isEmpty", res: "i", code: "ri(i32(!a))" },
  { name: "ord",     res: "i", code: "ri(T.ord(a, b))" },
  { name: "min",     res: "v", code: "st(T.min(a, b))" },
  { name: "max",     res: "v", code: "st(T.max(a, b))" },
  { name: "popcnt",  res: "i", code: "ri(T.popcnt(a))" },
  { name: "clz",     res: "i", code: "ri(T.clz(a))" },
  { name: "ctz",     res: "i", code: "ri(T.ctz(a))" },
  { name: "sqrt",    res: "v", code: "st(T.sqrt(a))" },
  { name: "muldiv",  res: "v", code: "st(T.muldiv(a, b, c))" },
  { name: "muldivUp", res: "v", code: "st(T.muldivUp(a, b, c))", only: "u" },
  { name: "mulmod",  res: "v", code: "st(T.mulmod(a, b, c))", only: "u" },
  { name: "addmod",  res: "v", code: "st(T.addmod(a, b, c))", only: "u" },
  { name: "rotl",    res: "v", code: "st(T.rotl(a, n))", only: "u" },
  { name: "rotr",    res: "v", code: "st(T.rotr(a, n))", only: "u" },
  { name: "abs",     res: "v", code: "st(T.abs(a))", only: "s" },
  { name: "sign",    res: "i", code: "ri(T.sign(a))", only: "s" },
  { name: "toString", res: "s", code: "let s = a.toString(n); assert(T.fromString(s, n) == a); rs(s)" },
  { name: "toF64",   res: "f", code: "rf(a.toF64())" },
  { name: "fromF64", res: "v", code: "st(T.fromF64(load<f64>(IO + 272)))" },
  { name: "bytesBE", res: "v", code: "let x = a.toUint8Array(true); assert(T.fromUint8ArrayBE(x) == a); st(T.fromUint8ArrayLE(x))" },
  { name: "toU64",   res: "v", code: "st(T.fromU64(a.toU64()))" },
  { name: "toI64",   res: "v", code: "st(T.fromI64(a.toI64()))" },
  { name: "toI32",   res: "v", code: "st(T.fromI32(a.toI32()))" },
];

function opsFor(type) {
  return OPS.filter((op) => !op.only || (op.only == "s") == type.signed);
}

// fixed point: `I` is the raw integer type, `FP` the class, `Q` the tag giving the
// number of fractional bits `F`
const ALL_FIXED = [
  { name: "fp128_u8",    cls: "fp128",     tag: "u8",   F: 8,   bits: 128, safe: false },
  { name: "fp128_u24",   cls: "fp128",     tag: "u24",  F: 24,  bits: 128, safe: false },
  { name: "fp128_u64",   cls: "fp128",     tag: "u64",  F: 64,  bits: 128, safe: false },
  { name: "fp128_u120",  cls: "fp128",     tag: "u120", F: 120, bits: 128, safe: false },
  { name: "fp256_u40",   cls: "fp256",     tag: "u40",  F: 40,  bits: 256, safe: false },
  { name: "fp256_u128",  cls: "fp256",     tag: "u128", F: 128, bits: 256, safe: false },
  { name: "fp256_u192",  cls: "fp256",     tag: "u192", F: 192, bits: 256, safe: false },
  { name: "fp128s_u64",  cls: "fp128Safe", tag: "u64",  F: 64,  bits: 128, safe: true },
  { name: "fp256s_u128", cls: "fp256Safe", tag: "u128", F: 128, bits: 256, safe: true },
];
const FIXED = process.env.FUZZ_TYPES
  ? ALL_FIXED.filter((t) => process.env.FUZZ_TYPES.split(",").includes(t.name))
  : ALL_FIXED;

const FIXED_OPS = [
  { name: "add",     res: "v", code: "st<I>((a + b).value)" },
  { name: "sub",     res: "v", code: "st<I>((a - b).value)" },
  { name: "mul",     res: "v", code: "st<I>((a * b).value)" },
  { name: "div",     res: "v", code: "st<I>((a / b).value)" },
  { name: "rem",     res: "v", code: "st<I>((a % b).value)" },
  { name: "pow",     res: "v", code: "st<I>((a ** n).value)" },
  { name: "neg",     res: "v", code: "st<I>((-a).value)" },
  { name: "abs",     res: "v", code: "st<I>(a.abs().value)" },
  { name: "sqrt",    res: "v", code: "st<I>(a.sqrt().value)" },
  { name: "floor",   res: "v", code: "st<I>(a.floor().value)" },
  { name: "ceil",    res: "v", code: "st<I>(a.ceil().value)" },
  { name: "trunc",   res: "v", code: "st<I>(a.trunc().value)" },
  { name: "round",   res: "v", code: "st<I>(a.round().value)" },
  { name: "frac",    res: "v", code: "st<I>(a.frac().value)" },
  { name: "muldiv",  res: "v", code: "st<I>(a.muldiv(b, c).value)" },
  { name: "min",     res: "v", code: "st<I>(a.min(b).value)" },
  { name: "max",     res: "v", code: "st<I>(a.max(b).value)" },
  { name: "eq",      res: "i", code: "ri(i32(a == b))" },
  { name: "ne",      res: "i", code: "ri(i32(a != b))" },
  { name: "lt",      res: "i", code: "ri(i32(a < b))" },
  { name: "le",      res: "i", code: "ri(i32(a <= b))" },
  { name: "gt",      res: "i", code: "ri(i32(a > b))" },
  { name: "ge",      res: "i", code: "ri(i32(a >= b))" },
  { name: "ord",     res: "i", code: "ri(a.ord(b))" },
  { name: "sign",    res: "i", code: "ri(a.sign())" },
  { name: "toString", res: "s", code: "let s = a.toString(n); if (n < 0) assert(FP.fromString<Q>(s) == a); rs(s)" },
  { name: "fromString", res: "v", code: "st<I>(FP.fromString<Q>(changetype<string>(load<usize>(IO + 264))).value)" },
  { name: "fromF64", res: "v", code: "st<I>(FP.fromF64<Q>(load<f64>(IO + 272)).value)" },
  { name: "toF64",   res: "f", code: "rf(a.toF64())" },
  { name: "fromInt", res: "v", code: "st<I>(FP.fromI<Q>(ld<I>(0)).value)" },
  { name: "toInt",   res: "v", code: "st<I>(a.toI())" },
];

// ---------------------------------------------------------------------------------------
// harness

function harness() {
  const imports = [...new Set(TYPES.map((t) => t.module))]
    .map((m) => `import { ${TYPES.filter((t) => t.module == m).map((t) => t.name).join(", ")} } from "../../assembly/${m}";`)
    .join("\n");
  let src = `${imports}

// A, B, C operands at 0, 64, 128; result at 192; i32 argument at 256; i32 result at 260;
// string result pointer at 264; f64 result at 272 (also the f64 argument)
const IO = memory.data(512, 16);
export function io(): usize { return IO; }

function ld<T>(off: usize): T {
  let r = changetype<T>(__new(offsetof<T>(), idof<T>()));
  memory.copy(changetype<usize>(r), IO + off, offsetof<T>());
  return r;
}
function st<T>(v: T): void { memory.copy(IO + 192, changetype<usize>(v), offsetof<T>()); }
function ri(v: i32): void { store<i32>(IO + 260, v); }
function rf(v: f64): void { store<f64>(IO + 272, v); }
function rs(v: string): void { store<usize>(IO + 264, changetype<usize>(v)); }
`;
  for (const type of TYPES) {
    const ops = opsFor(type);
    src += `
export function run_${type.name}(op: i32): void {
  let a = ld<${type.name}>(0), b = ld<${type.name}>(64), c = ld<${type.name}>(128);
  let n = load<i32>(IO + 256);
  switch (op) {
${ops.map((op, i) => `    case ${i}: { ${op.code.replaceAll("T.", type.name + ".").replaceAll("st(", `st<${type.name}>(`)}; break; }`).join("\n")}
  }
}
`;
  }
  if (FIXED.length) {
    src += `import { fp128, fp256, fp128Safe, fp256Safe, u24, u40, u120, u192 } from "../../assembly/fixed";\n`;
    if (!TYPES.some((t) => t.name == "i128")) src += `import { i128 } from "../../assembly/integer/i128";\n`;
    if (!TYPES.some((t) => t.name == "i256")) src += `import { i256 } from "../../assembly/integer/i256";\n`;
    if (!TYPES.some((t) => t.name == "u128")) src += `import { u128 } from "../../assembly/integer/u128";\n`;
  }
  for (const type of FIXED) {
    const I = type.bits == 128 ? "i128" : "i256";
    const T = `${type.cls}<${type.tag}>`;
    src += `
export function run_${type.name}(op: i32): void {
  let a = new ${T}(ld<${I}>(0)), b = new ${T}(ld<${I}>(64)), c = new ${T}(ld<${I}>(128));
  let n = load<i32>(IO + 256);
  switch (op) {
${FIXED_OPS.map((op, i) => `    case ${i}: { ${op.code
      .replaceAll("st<I>", `st<${I}>`)
      .replaceAll("ld<I>", `ld<${I}>`)
      .replaceAll("FP.fromI<Q>", `${type.cls}.fromI${type.bits}<${type.tag}>`)
      .replaceAll("a.toI()", `a.toI${type.bits}()`)
      .replaceAll("FP.", `${type.cls}.`)
      .replaceAll("<Q>", `<${type.tag}>`)}; break; }`).join("\n")}
  }
}
`;
  }
  return src;
}

function compile() {
  mkdirSync(outDir, { recursive: true });
  const src = join(outDir, "harness.ts");
  writeFileSync(src, harness());
  const wasm = join(outDir, "harness.wasm");
  execFileSync(
    join(root, "node_modules", ".bin", "asc"),
    [src, "--runtime", "stub", "-O3", "--exportRuntime", "-o", wasm],
    { stdio: "inherit", cwd: root },
  );
  return readFileSync(wasm);
}

// ---------------------------------------------------------------------------------------
// random values

function rnd64() {
  // xorshift64*
  seed ^= seed >> 12n;
  seed ^= (seed << 25n) & 0xFFFFFFFFFFFFFFFFn;
  seed ^= seed >> 27n;
  seed &= 0xFFFFFFFFFFFFFFFFn;
  return (seed * 0x2545F4914F6CDD1Dn) & 0xFFFFFFFFFFFFFFFFn;
}
const rndInt = (n) => Number(rnd64() % BigInt(n));

function rndBits(bits) {
  let v = 0n;
  for (let i = 0; i < bits; i += 64) v = (v << 64n) | rnd64();
  return v & ((1n << BigInt(bits)) - 1n);
}

// unsigned bit pattern of `bits` bits, biased toward edge cases
function rndValue(bits) {
  const B = BigInt(bits);
  const max = (1n << B) - 1n;
  switch (rndInt(12)) {
    case 0: return [0n, 1n, 2n, 3n, 10n, max, max - 1n, 1n << (B - 1n), (1n << (B - 1n)) - 1n, (1n << (B - 1n)) + 1n][rndInt(10)];
    case 1: { const k = BigInt(rndInt(bits)); return ((1n << k) + BigInt(rndInt(3)) - 1n) & max; }
    case 2: return rndBits(rndInt(64) + 1);                 // small
    case 3: return rndBits(rndInt(bits) + 1);               // any magnitude
    case 4: return max - rndBits(rndInt(bits) + 1);         // close to max / small negative
    case 5: {                                               // limbs of 0 / ~0 / random
      let v = 0n;
      for (let i = 0; i < bits / 32; i++) v = (v << 32n) | [0n, 0xFFFFFFFFn, rndBits(32)][rndInt(3)];
      return v;
    }
    default: return rndBits(bits);
  }
}

// ---------------------------------------------------------------------------------------
// reference implementation

class Throws {}
const THROWS = new Throws();

function reference(type, op, a, b, c, n, f) {
  const B = BigInt(type.bits);
  const signed = type.signed;
  const min = signed ? -(1n << (B - 1n)) : 0n;
  const max = signed ? (1n << (B - 1n)) - 1n : (1n << B) - 1n;
  const wrap = (x) => (signed ? BigInt.asIntN(type.bits, x) : BigInt.asUintN(type.bits, x));
  // checked result: safe types throw when it doesn't fit
  const chk = (x) => {
    if (type.safe && (x < min || x > max)) return THROWS;
    return wrap(x);
  };
  const tdiv = (x, y) => x / y; // BigInt division truncates toward zero
  const bits = (x) => BigInt.asUintN(type.bits, x);
  const isqrt = (x) => {
    if (x < 2n) return x;
    let r = 1n << BigInt((x.toString(2).length >> 1) + 1);
    for (;;) {
      const y = (r + x / r) >> 1n;
      if (y >= r) return r;
      r = y;
    }
  };
  switch (op) {
    case "add": return chk(a + b);
    case "sub": return chk(a - b);
    case "mul": return chk(a * b);
    case "div": return b == 0n ? THROWS : chk(tdiv(a, b));
    case "rem": return b == 0n ? THROWS : a % b;
    case "pow": {
      if (n < 0) return a == 1n ? 1n : signed && a == -1n ? (n & 1 ? -1n : 1n) : 0n;
      if (!type.safe) {
        // square and multiply on wrapped values
        let r = 1n, x = a;
        for (let e = n; e > 0; e >>= 1) {
          if (e & 1) r = wrap(r * x);
          x = wrap(x * x);
        }
        return r;
      }
      if (a == 0n || a == 1n || a == -1n || n < 2 * type.bits) return chk(a ** BigInt(n));
      return THROWS; // |a| >= 2 and a huge exponent
    }
    case "shl": return n < 0 || n >= type.bits ? 0n : wrap(a << BigInt(n));
    case "shr": return n < 0 || n >= type.bits ? (a < 0n ? -1n : 0n) : a >> BigInt(n);
    case "shr_u": return n < 0 || n >= type.bits ? 0n : wrap(bits(a) >> BigInt(n));
    case "and": return wrap(a & b);
    case "or": return wrap(a | b);
    case "xor": return wrap(a ^ b);
    case "not": return wrap(~a);
    case "neg": return chk(-a);
    case "preInc": return chk(a + 1n);
    case "preDec": return chk(a - 1n);
    case "postInc": return chk(a + 1n);
    case "eq": return a == b ? 1 : 0;
    case "ne": return a != b ? 1 : 0;
    case "lt": return a < b ? 1 : 0;
    case "le": return a <= b ? 1 : 0;
    case "gt": return a > b ? 1 : 0;
    case "ge": return a >= b ? 1 : 0;
    case "isEmpty": return a == 0n ? 1 : 0;
    case "ord": return a > b ? 1 : a < b ? -1 : 0;
    case "min": return a < b ? a : b;
    case "max": return a > b ? a : b;
    case "popcnt": return bits(a).toString(2).replaceAll("0", "").length;
    case "clz": return a == 0n ? type.bits : type.bits - bits(a).toString(2).length;
    case "ctz": {
      if (a == 0n) return type.bits;
      let x = bits(a), k = 0;
      while (!(x & 1n)) { x >>= 1n; k++; }
      return k;
    }
    case "sqrt": return a < 0n ? THROWS : isqrt(a);
    case "muldiv":
    case "muldivUp": {
      if (c == 0n) return THROWS;
      let p = a * b;
      let q = tdiv(p, c);
      if (op == "muldivUp" && q * c != p) q += 1n;
      return q < min || q > max ? THROWS : q;
    }
    case "mulmod": return c == 0n ? THROWS : (a * b) % c;
    case "addmod": return c == 0n ? THROWS : (a + b) % c;
    case "rotl": {
      const k = BigInt(((n % type.bits) + type.bits) % type.bits);
      return wrap((a << k) | (a >> (B - k)));
    }
    case "rotr": {
      const k = BigInt(((n % type.bits) + type.bits) % type.bits);
      return wrap((a >> k) | (a << (B - k)));
    }
    case "abs": return chk(a < 0n ? -a : a);
    case "sign": return a < 0n ? -1 : a > 0n ? 1 : 0;
    case "toString": return a.toString(n);
    case "toF64": return Number(a);
    case "fromF64": return Number.isFinite(f) ? wrap(BigInt(Math.trunc(f))) : THROWS;
    case "bytesBE": {
      // reading the big-endian bytes as little-endian reverses the byte order
      let x = bits(a), r = 0n;
      for (let i = 0; i < type.bits / 8; i++) { r = (r << 8n) | (x & 0xFFn); x >>= 8n; }
      return wrap(r);
    }
    case "toU64": return wrap(BigInt.asUintN(64, a));
    case "toI64": return wrap(BigInt.asIntN(64, a));
    case "toI32": return wrap(BigInt.asIntN(32, a));
  }
  throw new Error("no reference for " + op);
}

// ---------------------------------------------------------------------------------------
// run

const wasmBinary = compile();
let lastAbort = "";
let memory;
const readString = (ptr) => {
  if (!ptr) return "null";
  const len = new Uint32Array(memory.buffer, ptr - 4, 1)[0];
  return String.fromCharCode(...new Uint16Array(memory.buffer, ptr, len >> 1));
};
const { instance } = await WebAssembly.instantiate(wasmBinary, {
  env: {
    abort(msg, file, line, col) {
      lastAbort = `${readString(msg)} (${readString(file)}:${line}:${col})`;
      throw new Throws();
    },
    trace() {},
    seed: () => Number(rnd64() % 1000000n),
  },
});
const ex = instance.exports;
memory = ex.memory;
const IO = ex.io();

function writeBig(off, value, bits) {
  let x = BigInt.asUintN(bits, value);
  const view = new DataView(memory.buffer);
  for (let i = 0; i < bits / 64; i++) {
    view.setBigUint64(IO + off + i * 8, x & 0xFFFFFFFFFFFFFFFFn, true);
    x >>= 64n;
  }
}
function readBig(off, bits, signed) {
  const view = new DataView(memory.buffer);
  let x = 0n;
  for (let i = bits / 64 - 1; i >= 0; i--) x = (x << 64n) | view.getBigUint64(IO + off + i * 8, true);
  return signed ? BigInt.asIntN(bits, x) : x;
}

function randomFloat() {
  switch (rndInt(6)) {
    case 0: return [0, -0, 0.5, -0.5, 1.5, -1, NaN, Infinity, -Infinity, 2 ** 64, -(2 ** 64), 2 ** 127, 2 ** 255, 2 ** 300][rndInt(14)];
    case 1: return (rndInt(2) ? -1 : 1) * Math.random() * 2 ** 53;
    default: return (rndInt(2) ? -1 : 1) * Math.random() * 2 ** rndInt(270);
  }
}

let failures = 0;
let checks = 0;
const show = (v) => (v === THROWS ? "<throws>" : typeof v == "bigint" ? v.toString() + "n" : String(v));

for (const type of TYPES) {
  const ops = opsFor(type);
  const run = ex[`run_${type.name}`];
  const conv = (x) => (type.signed ? BigInt.asIntN(type.bits, x) : x);
  for (let opIndex = 0; opIndex < ops.length; opIndex++) {
    const op = ops[opIndex].name;
    if (process.env.FUZZ_VERBOSE) console.log(`${type.name}.${op}`);
    let opFailures = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      let a = conv(rndValue(type.bits));
      let b = rndInt(8) == 0 ? a : conv(rndValue(type.bits));
      let c = conv(rndValue(type.bits));
      if (op == "postInc") b = a;
      let n;
      if (op == "pow") n = rndInt(10) == 0 ? -rndInt(5) : rndInt(4) == 0 ? rndInt(600) : rndInt(40);
      else if (op == "toString") n = [10, 16, 2, 8, 36, 3 + rndInt(33)][rndInt(6)];
      else n = rndInt(10) == 0 ? -rndInt(1000) - 1 : rndInt(10) == 0 ? type.bits + rndInt(1000) : rndInt(type.bits);
      if (op == "pow" && rndInt(3) == 0) a = conv(BigInt(rndInt(20)) - (type.signed ? 10n : 0n));
      const f = randomFloat();

      writeBig(0, a, type.bits);
      writeBig(64, b, type.bits);
      writeBig(128, c, type.bits);
      new DataView(memory.buffer).setInt32(IO + 256, n, true);
      new DataView(memory.buffer).setFloat64(IO + 272, f, true);

      let got;
      try {
        run(opIndex);
        const res = ops[opIndex].res;
        const view = new DataView(memory.buffer);
        if (res == "v") got = readBig(192, type.bits, type.signed);
        else if (res == "i") got = view.getInt32(IO + 260, true);
        else if (res == "f") got = view.getFloat64(IO + 272, true);
        else got = readString(view.getUint32(IO + 264, true));
      } catch (e) {
        if (!(e instanceof Throws)) throw e;
        got = THROWS;
      }
      const expected = reference(type, op, a, b, c, n, f);
      checks++;
      const same = expected === THROWS || got === THROWS
        ? expected === got
        : typeof expected == "number" && Number.isNaN(expected) ? Number.isNaN(got) : got === expected;
      if (!same) {
        failures++;
        if (++opFailures <= 3) {
          console.log(
            `FAIL ${type.name}.${op} a=${a} b=${b} c=${c} n=${n} f=${f}\n` +
            `     expected ${show(expected)}\n     got      ${show(got)}` +
            (got === THROWS ? `  [${lastAbort}]` : ""),
          );
        }
      }
    }
    if (opFailures > 3) console.log(`     ... ${opFailures} failures for ${type.name}.${op}`);
  }
}

// ---------------------------------------------------------------------------------------
// fixed point

function fixedReference(type, op, a, b, c, n, f, str) {
  const W = type.bits, F = BigInt(type.F);
  const min = -(1n << BigInt(W - 1)), max = (1n << BigInt(W - 1)) - 1n;
  const wrap = (x) => BigInt.asIntN(W, x);
  const fits = (x) => x >= min && x <= max;
  // plain types wrap around, safe types throw
  const res = (x) => (type.safe && !fits(x) ? THROWS : wrap(x));
  const abs = (x) => (x < 0n ? -x : x);
  const one = 1n << F;
  const mask = one - 1n;
  const mul = (x, y) => { const m = (abs(x) * abs(y)) >> F; return (x < 0n) != (y < 0n) ? -m : m; };
  const div = (x, y) => { const m = (abs(x) << F) / abs(y); return (x < 0n) != (y < 0n) ? -m : m; };
  const floor = (x) => (x >> F) << F;
  const ceil = (x) => (x & mask ? floor(x) + one : x);
  const trunc = (x) => (x < 0n ? ceil(x) : floor(x));
  const isqrt = (x) => {
    if (x < 2n) return x;
    let r = 1n << BigInt((x.toString(2).length >> 1) + 1);
    for (;;) { const y = (r + x / r) >> 1n; if (y >= r) return r; r = y; }
  };
  switch (op) {
    case "add": return res(a + b);
    case "sub": return res(a - b);
    case "mul": return res(mul(a, b));
    case "div": return b == 0n ? THROWS : res(div(a, b));
    case "rem": return b == 0n ? THROWS : a % b;
    case "pow": {
      // same steps as the implementation: each multiplication wraps (or throws)
      let overflow = false;
      const step = (x) => { if (!fits(x)) overflow = true; return wrap(x); };
      let r = one, t = a;
      for (let e = Math.abs(n); e > 0;) {
        if (e & 1) r = step(mul(r, t));
        e >>= 1;
        if (e) t = step(mul(t, t));
      }
      if (n < 0) { if (r == 0n) return THROWS; r = step(div(one, r)); }
      return type.safe && overflow ? THROWS : r;
    }
    case "neg": return res(-a);
    case "abs": return res(abs(a));
    case "sqrt": return a < 0n ? THROWS : isqrt(a << F);
    case "floor": return floor(a);
    case "ceil": return res(ceil(a));
    case "trunc": return res(trunc(a));
    case "round": {
      const half = one >> 1n;
      const r = a < 0n ? a - half : a + half;
      if (type.safe && !fits(r)) return THROWS;
      return trunc(wrap(r));
    }
    case "frac": return a - trunc(a);
    case "muldiv": {
      if (c == 0n) return THROWS;
      const m = (abs(a) * abs(b)) / abs(c);
      const q = ((a < 0n) != (b < 0n)) != (c < 0n) ? -m : m;
      return fits(q) ? q : THROWS;
    }
    case "min": return a < b ? a : b;
    case "max": return a > b ? a : b;
    case "eq": return a == b ? 1 : 0;
    case "ne": return a != b ? 1 : 0;
    case "lt": return a < b ? 1 : 0;
    case "le": return a <= b ? 1 : 0;
    case "gt": return a > b ? 1 : 0;
    case "ge": return a >= b ? 1 : 0;
    case "ord": return a > b ? 1 : a < b ? -1 : 0;
    case "sign": return a < 0n ? -1 : a > 0n ? 1 : 0;
    case "toString": {
      const m = abs(a);
      const int = (m >> F).toString();
      // frac / 2^F = frac * 5^F / 10^F
      let digits = ((m & mask) * 5n ** F).toString().padStart(type.F, "0");
      if (n < 0) digits = digits.replace(/0+$/, "");
      else digits = digits.slice(0, n).padEnd(n, "0");
      const out = digits.length ? `${int}.${digits}` : int;
      // no sign when every printed digit is zero
      return a < 0n && /[1-9]/.test(out) ? "-" + out : out;
    }
    case "fromString": {
      const match = /^([+-]?)(\d*)(?:\.(\d*))?/.exec(str);
      const intPart = BigInt(match[2] || "0");
      const fracDigits = (match[3] || "").slice(0, 255);
      const fracPart = fracDigits ? (BigInt(fracDigits) << F) / 10n ** BigInt(fracDigits.length) : 0n;
      const m = (intPart << F) + fracPart;
      return res(match[1] == "-" ? -m : m);
    }
    case "fromF64": {
      if (!Number.isFinite(f)) return THROWS;
      return res(BigInt(Math.trunc(f * 2 ** type.F)));
    }
    case "toF64": return Number(a) * 2 ** -type.F;
    case "fromInt": return res(a << F);
    case "toInt": { const m = abs(a) >> F; return a < 0n ? -m : m; }
  }
  throw new Error("no reference for " + op);
}

function randomFixedString(type) {
  const intDigits = rndInt(Math.ceil((type.bits - type.F) / 3.3) + 3);
  let str = ["", "-", "+"][rndInt(3)];
  for (let i = 0; i < intDigits; i++) str += rndInt(10);
  if (rndInt(4)) {
    str += ".";
    const fracDigits = rndInt(4) == 0 ? rndInt(300) : rndInt(25);
    for (let i = 0; i < fracDigits; i++) str += rndInt(10);
  }
  if (rndInt(10) == 0) str += "x12";
  return str;
}

function writeString(str) {
  const ptr = ex.__new(str.length * 2, 2); // id 2 = String
  const view = new Uint16Array(memory.buffer, ptr, str.length);
  for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);
  new DataView(memory.buffer).setUint32(IO + 264, ptr, true);
}

for (const type of FIXED) {
  const run = ex[`run_${type.name}`];
  for (let opIndex = 0; opIndex < FIXED_OPS.length; opIndex++) {
    const op = FIXED_OPS[opIndex].name;
    if (process.env.FUZZ_VERBOSE) console.log(`${type.name}.${op}`);
    let opFailures = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const conv = (x) => BigInt.asIntN(type.bits, x);
      let a = conv(rndValue(type.bits));
      // operands around 1.0 too, so that products and powers don't always overflow
      if (rndInt(3) == 0) a = conv(rndBits(type.F + rndInt(8)) * (rndInt(2) ? -1n : 1n));
      let b = rndInt(8) == 0 ? a : conv(rndValue(type.bits));
      if (rndInt(3) == 0) b = conv(rndBits(type.F + rndInt(8)) * (rndInt(2) ? -1n : 1n));
      let c = conv(rndValue(type.bits));
      if (op == "fromInt") a = conv(rndInt(2) ? rndValue(type.bits) : rndBits(rndInt(type.bits - type.F + 2)) * (rndInt(2) ? -1n : 1n));
      let n = op == "pow" ? rndInt(12) - 3 : op == "toString" ? rndInt(30) - 5 : 0;
      if (op == "toString" && n < 0) n = -1;
      const f = randomFloat();
      const str = randomFixedString(type);

      writeBig(0, a, type.bits);
      writeBig(64, b, type.bits);
      writeBig(128, c, type.bits);
      new DataView(memory.buffer).setInt32(IO + 256, n, true);
      new DataView(memory.buffer).setFloat64(IO + 272, f, true);
      if (op == "fromString") writeString(str);

      let got;
      try {
        run(opIndex);
        const kind = FIXED_OPS[opIndex].res;
        const view = new DataView(memory.buffer);
        if (kind == "v") got = readBig(192, type.bits, true);
        else if (kind == "i") got = view.getInt32(IO + 260, true);
        else if (kind == "f") got = view.getFloat64(IO + 272, true);
        else got = readString(view.getUint32(IO + 264, true));
      } catch (e) {
        if (!(e instanceof Throws)) throw e;
        got = THROWS;
      }
      const expected = fixedReference(type, op, a, b, c, n, f, str);
      checks++;
      const same = expected === THROWS || got === THROWS ? expected === got : got === expected;
      if (!same) {
        failures++;
        if (++opFailures <= 3) {
          console.log(
            `FAIL ${type.name}.${op} a=${a} b=${b} c=${c} n=${n} f=${f} str=${JSON.stringify(str)}\n` +
            `     expected ${show(expected)}\n     got      ${show(got)}` +
            (got === THROWS ? `  [${lastAbort}]` : ""),
          );
        }
      }
    }
    if (opFailures > 3) console.log(`     ... ${opFailures} failures for ${type.name}.${op}`);
  }
}

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
