/**
 * Calculates the ceiling of a division of two bigints
 * @param x
 * @param y
 * @returns
 */
export const bigIntCeil = (x: bigint, y: bigint): bigint => {
  return x / y + (x % y ? 1n : 0n);
};
