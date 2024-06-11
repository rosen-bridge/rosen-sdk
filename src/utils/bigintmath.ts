export class BigIntMath {
  static max(a: bigint, b: bigint): bigint {
    if (a > b) {
      return a;
    }

    return b;
  }

  static ceil(n: bigint, d: bigint): bigint {
    return n / d + (n % d ? 1n : 0n);
  }

  static floor(n: bigint, d: bigint): bigint {
    return n / d;
  }

  static pow(base: bigint, exponent: bigint): bigint {
    return base ** exponent;
  }
}
