import { it, expect, describe } from "vitest";
import { AssetBalanceMath } from "../../src/utils/assetBalanceMath";

describe("AssetBalanceMath.sum", () => {
  it("should sum native tokens correctly", () => {
    const a = { nativeToken: 10n, tokens: [] };
    const b = { nativeToken: 20n, tokens: [] };
    const result = AssetBalanceMath.sum(a, b);
    expect(result.nativeToken).toBe(30n);
  });

  it("should aggregate token balances correctly", () => {
    const a = {
      nativeToken: 0n,
      tokens: [
        { id: "token1", value: 10n },
        { id: "token2", value: 20n },
      ],
    };
    const b = {
      nativeToken: 0n,
      tokens: [
        { id: "token2", value: 30n },
        { id: "token3", value: 40n },
      ],
    };
    const result = AssetBalanceMath.sum(a, b);
    expect(result.tokens.length).toBe(3);
    expect(result.tokens.find((token) => token.id === "token1")?.value).toBe(
      10n
    );
    expect(result.tokens.find((token) => token.id === "token2")?.value).toBe(
      50n
    );
    expect(result.tokens.find((token) => token.id === "token3")?.value).toBe(
      40n
    );
  });

  it("should handle empty token arrays correctly", () => {
    const a = { nativeToken: 100n, tokens: [] };
    const b = { nativeToken: 200n, tokens: [] };
    const result = AssetBalanceMath.sum(a, b);
    expect(result.tokens.length).toBe(0);
  });

  it("should handle common and unique tokens correctly", () => {
    const a = {
      nativeToken: 0n,
      tokens: [
        { id: "token1", value: 10n },
        { id: "token2", value: 20n },
      ],
    };
    const b = {
      nativeToken: 0n,
      tokens: [
        { id: "token2", value: 30n },
        { id: "token3", value: 40n },
      ],
    };
    const result = AssetBalanceMath.sum(a, b);
    expect(result.tokens.length).toBe(3);
    expect(result.tokens.find((token) => token.id === "token1")?.value).toBe(
      10n
    );
    expect(result.tokens.find((token) => token.id === "token2")?.value).toBe(
      50n
    );
    expect(result.tokens.find((token) => token.id === "token3")?.value).toBe(
      40n
    );
  });
});

describe("AssetBalanceMath.subtract", () => {
  it("should subtract native tokens correctly", () => {
    const a = { nativeToken: 30n, tokens: [] };
    const b = { nativeToken: 10n, tokens: [] };
    const result = AssetBalanceMath.subtract(a, b);
    expect(result.nativeToken).toBe(20n);
  });

  it("should subtract token balances correctly", () => {
    const a = {
      nativeToken: 0n,
      tokens: [
        { id: "token1", value: 30n },
        { id: "token2", value: 40n },
      ],
    };
    const b = {
      nativeToken: 0n,
      tokens: [
        { id: "token1", value: 10n },
        { id: "token2", value: 20n },
      ],
    };
    const result = AssetBalanceMath.subtract(a, b, 0n, true);
    expect(result.tokens.length).toBe(2);
    expect(result.tokens.find((token) => token.id === "token1")?.value).toBe(
      20n
    );
    expect(result.tokens.find((token) => token.id === "token2")?.value).toBe(
      20n
    );
  });

  it("should handle native token minimum correctly", () => {
    const a = { nativeToken: 20n, tokens: [] };
    const b = { nativeToken: 30n, tokens: [] };
    expect(() => AssetBalanceMath.subtract(a, b, 15n)).toThrow();
  });

  it("should handle allowNegativeNativeToken correctly", () => {
    const a = { nativeToken: 20n, tokens: [] };
    const b = { nativeToken: 30n, tokens: [] };
    const result = AssetBalanceMath.subtract(a, b, 15n, true);
    expect(result.nativeToken).toBe(0n);
  });

  it("should handle token not found correctly", () => {
    const a = { nativeToken: 0n, tokens: [{ id: "token1", value: 30n }] };
    const b = { nativeToken: 0n, tokens: [{ id: "token2", value: 20n }] };
    expect(() => AssetBalanceMath.subtract(a, b)).toThrow();
  });

  it("should handle token value less than target correctly", () => {
    const a = { nativeToken: 0n, tokens: [{ id: "token1", value: 30n }] };
    const b = { nativeToken: 0n, tokens: [{ id: "token1", value: 40n }] };
    expect(() => AssetBalanceMath.subtract(a, b)).toThrow();
  });

  it("should handle token value equal to target correctly", () => {
    const a = { nativeToken: 0n, tokens: [{ id: "token1", value: 30n }] };
    const b = { nativeToken: 0n, tokens: [{ id: "token1", value: 30n }] };
    const result = AssetBalanceMath.subtract(a, b, 0n, true);
    expect(result.tokens.length).toBe(0);
  });
});
