import { AssetBalance, TokenInfo } from "../types/utxoTypes";

/**
 * Class providing mathematical operations on AssetBalance objects.
 */
export class AssetBalanceMath {
  /**
   * Sums two AssetBalance objects.
   *
   * @param a - The first AssetBalance object.
   * @param b - The second AssetBalance object.
   * @returns The aggregated AssetBalance object containing the sum of native tokens and all tokens.
   *
   * @example
   * const a = { nativeToken: 100n, tokens: [{ id: 'token1', value: 10n }] };
   * const b = { nativeToken: 200n, tokens: [{ id: 'token1', value: 20n }, { id: 'token2', value: 30n }] };
   * const result = AssetBalanceMath.sum(a, b);
   * // result is { nativeToken: 300n, tokens: [{ id: 'token1', value: 30n }, { id: 'token2', value: 30n }] }
   */
  public static sum(a: AssetBalance, b: AssetBalance): AssetBalance {
    const nativeToken = a.nativeToken + b.nativeToken;
    const tokens: Array<TokenInfo> = [];

    // Aggregate tokens from both AssetBalance objects
    [...a.tokens, ...b.tokens].forEach((token) => {
      const targetToken = tokens.find((item) => item.id === token.id);
      if (targetToken) {
        targetToken.value += token.value;
      } else {
        tokens.push(structuredClone(token));
      }
    });

    return {
      nativeToken,
      tokens,
    };
  }

  /**
   * Subtracts one AssetBalance object from another.
   *
   * @param a - The AssetBalance object to subtract from.
   * @param b - The AssetBalance object to subtract.
   * @param minimumNativeToken - The minimum allowed native token balance (default is 0).
   * @param allowNegativeNativeToken - If true, sets nativeToken to 0 instead of throwing an error when the result is negative.
   * @returns The reduced AssetBalance object.
   *
   * @throws Will throw an error if the native token in `a` is less than the native token in `b` plus `minimumNativeToken`, unless `allowNegativeNativeToken` is true.
   * @throws Will throw an error if `b` contains a token that is not in `a`, or if the token value in `b` is greater than in `a`.
   *
   * @example
   * const a = { nativeToken: 300n, tokens: [{ id: 'token1', value: 30n }] };
   * const b = { nativeToken: 200n, tokens: [{ id: 'token1', value: 20n }] };
   * const result = AssetBalanceMath.subtract(a, b);
   * // result is { nativeToken: 100n, tokens: [{ id: 'token1', value: 10n }] }
   */
  public static subtract(
    a: AssetBalance,
    b: AssetBalance,
    minimumNativeToken = 0n,
    allowNegativeNativeToken = false
  ): AssetBalance {
    let nativeToken = 0n;

    // Calculate the new native token balance
    if (a.nativeToken > b.nativeToken + minimumNativeToken) {
      nativeToken = a.nativeToken - b.nativeToken;
    } else if (allowNegativeNativeToken) {
      nativeToken = 0n;
    } else {
      throw new Error(
        `Cannot reduce native token: [${a.nativeToken.toString()}] is less than [${b.nativeToken.toString()} + ${minimumNativeToken.toString()}]`
      );
    }

    // Reduce tokens from AssetBalance a by those in AssetBalance b
    const tokens = structuredClone(a.tokens);
    b.tokens.forEach((token) => {
      const index = tokens.findIndex((item) => item.id === token.id);
      if (index !== -1) {
        if (tokens[index].value > token.value) {
          tokens[index].value -= token.value;
        } else if (tokens[index].value === token.value) {
          tokens.splice(index, 1);
        } else {
          throw new Error(
            `Cannot reduce token [${token.id}]: [${tokens[
              index
            ].value.toString()}] is less than [${token.value.toString()}]`
          );
        }
      } else {
        throw new Error(`Cannot reduce token [${token.id}]: Token not found`);
      }
    });

    return {
      nativeToken,
      tokens,
    };
  }
}
