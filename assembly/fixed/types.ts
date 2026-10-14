// Type tags giving the number of fractional bits of fixed point types: `fp128<u40>` has
// 40 fractional bits. Builtin u8, u16, u32, u64 and the u128 / u256 classes work as
// tags too.
//
// The bit count is the byte size of the tag (`offsetof<Q>()`), so each tag only holds
// primitive fields, largest first: no padding, and no nested class (a nested class field
// is a 32-bit pointer, whatever its own size).

export class u24 {
  private _0: u16;
  private _1: u8;
}

export class u40 {
  private _0: u32;
  private _1: u8;
}

export class u48 {
  private _0: u32;
  private _1: u16;
}

export class u56 {
  private _0: u32;
  private _1: u16;
  private _2: u8;
}

export class u72 {
  private _0: u64;
  private _1: u8;
}

export class u80 {
  private _0: u64;
  private _1: u16;
}

export class u88 {
  private _0: u64;
  private _1: u16;
  private _2: u8;
}

export class u96 {
  private _0: u64;
  private _1: u32;
}

export class u104 {
  private _0: u64;
  private _1: u32;
  private _2: u8;
}

export class u112 {
  private _0: u64;
  private _1: u32;
  private _2: u16;
}

export class u120 {
  private _0: u64;
  private _1: u32;
  private _2: u16;
  private _3: u8;
}

export class u136 {
  private _0: u64;
  private _1: u64;
  private _2: u8;
}

export class u144 {
  private _0: u64;
  private _1: u64;
  private _2: u16;
}

export class u152 {
  private _0: u64;
  private _1: u64;
  private _2: u16;
  private _3: u8;
}

export class u160 {
  private _0: u64;
  private _1: u64;
  private _2: u32;
}

export class u168 {
  private _0: u64;
  private _1: u64;
  private _2: u32;
  private _3: u8;
}

export class u176 {
  private _0: u64;
  private _1: u64;
  private _2: u32;
  private _3: u16;
}

export class u184 {
  private _0: u64;
  private _1: u64;
  private _2: u32;
  private _3: u16;
  private _4: u8;
}

export class u192 {
  private _0: u64;
  private _1: u64;
  private _2: u64;
}
