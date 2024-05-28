export class BigIntMath {
  static max(a: bigint, b: bigint): bigint {
    if (a > b) {
      return a;
    }

    return b;
  }

  static ceil(n: bigint, d: bigint): bigint {
    const ceilResult = n / d + (n % d ? 1n : 0n);
    return ceilResult;
  }

  static floor(n: bigint, d: bigint): bigint {
    const ceilResult = n / d;
    return ceilResult;
  }
}
