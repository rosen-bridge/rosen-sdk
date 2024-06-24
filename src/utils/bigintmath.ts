/**
 * Class providing basic mathematical operations for BigInt values.
 */
export class BigIntMath {
  /**
   * Returns the maximum of two BigInt values.
   *
   * @param a - The first BigInt value.
   * @param b - The second BigInt value.
   * @returns The larger of the two BigInt values.
   *
   * @example
   * const result = BigIntMath.max(10n, 20n);
   * // result is 20n
   */
  static max(a: bigint, b: bigint): bigint {
    if (a > b) {
      return a;
    }
    return b;
  }

  /**
   * Computes the ceiling of the division of two BigInt values.
   *
   * @param n - The numerator BigInt value.
   * @param d - The denominator BigInt value.
   * @returns The ceiling of the division result as a BigInt.
   *
   * @example
   * const result = BigIntMath.ceil(10n, 3n);
   * // result is 4n
   */
  static ceil(n: bigint, d: bigint): bigint {
    return n / d + (n % d ? 1n : 0n);
  }

  /**
   * Computes the floor of the division of two BigInt values.
   *
   * @param n - The numerator BigInt value.
   * @param d - The denominator BigInt value.
   * @returns The floor of the division result as a BigInt.
   *
   * @example
   * const result = BigIntMath.floor(10n, 3n);
   * // result is 3n
   */
  static floor(n: bigint, d: bigint): bigint {
    return n / d;
  }

  /**
   * Computes the power of a BigInt base raised to a BigInt exponent.
   *
   * @param base - The base BigInt value.
   * @param exponent - The exponent BigInt value.
   * @returns The result of base raised to the power of exponent as a BigInt.
   *
   * @example
   * const result = BigIntMath.pow(2n, 3n);
   * // result is 8n
   */
  static pow(base: bigint, exponent: bigint): bigint {
    return base ** exponent;
  }
}
