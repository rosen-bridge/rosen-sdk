import { AssetBalance, TokenInfo } from "../types/utxoTypes";

/**
 * Class that provides functions related AssetBalance
 */
export class AssetBalanceMath {
  /**
   * sums two AssetBalance
   * @param a first AssetBalance object
   * @param b second AssetBalance object
   * @returns aggregated AssetBalance
   */
  public static sum(a: AssetBalance, b: AssetBalance): AssetBalance {
    // sum native token
    const nativeToken = a.nativeToken + b.nativeToken;
    const tokens: Array<TokenInfo> = [];

    // add all tokens to result
    [...a.tokens, ...b.tokens].forEach((token) => {
      const targetToken = tokens.find((item) => item.id === token.id);
      if (targetToken) targetToken.value += token.value;
      else tokens.push(structuredClone(token));
    });

    return {
      nativeToken,
      tokens,
    };
  }

  /**
   * subtracts two AssetBalance
   * @param a first AssetBalance object
   * @param b second AssetBalance object
   * @param minimumNativeToken minimum allowed native token
   * @param allowNegativeNativeToken if true, sets nativeToken as 0 instead of throwing error
   * @returns reduced AssetBalance
   */
  public static subtract(
    a: AssetBalance,
    b: AssetBalance,
    minimumNativeToken = 0n,
    allowNegativeNativeToken = false
  ): AssetBalance {
    // sum native token
    let nativeToken = 0n;
    if (a.nativeToken > b.nativeToken + minimumNativeToken)
      nativeToken = a.nativeToken - b.nativeToken;
    else if (allowNegativeNativeToken) nativeToken = 0n;
    else
      throw new Error(
        `Cannot reduce native token: [${a.nativeToken.toString()}] is less than [${b.nativeToken.toString()} + ${minimumNativeToken.toString()}]`
      );

    // reduce all `b` tokens
    const tokens = structuredClone(a.tokens);
    b.tokens.forEach((token) => {
      const index = tokens.findIndex((item) => item.id === token.id);
      if (index !== -1) {
        if (tokens[index].value > token.value)
          tokens[index].value -= token.value;
        else if (tokens[index].value === token.value) tokens.splice(index, 1);
        else
          throw new Error(
            `Cannot reduce token [${token.id}]: [${tokens[
              index
            ].value.toString()}] is less than [${token.value.toString()}]`
          );
      } else
        throw new Error(`Cannot reduce token [${token.id}]: Token not found`);
    });

    return {
      nativeToken,
      tokens,
    };
  }
}
