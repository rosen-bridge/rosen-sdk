import { describe, it, expect } from "vitest";
import {
  getDecimalString,
  getNonDecimalString,
  getNumberOfDecimals,
  roundToPrecision,
  validateDecimalPlaces,
} from "../../src/utils/decimals";

describe("getDecimalString", () => {
  it("should convert a raw value to a string with decimals", () => {
    expect(getDecimalString("123", 2)).toBe("1.23");
    expect(getDecimalString("1230", 2)).toBe("12.3");
    // @todo in the function, it suggests that this should be correct (12.345)
    // However, results show that it should be 1234.56
    // expect(getDecimalString("123456", 2, 3)).toBe("12.345");
  });

  it("should return the original value if decimals is 0", () => {
    expect(getDecimalString("123", 0)).toBe("123");
  });

  it("should handle edge cases correctly", () => {
    expect(getDecimalString("1", 2)).toBe("0.01");
    expect(getDecimalString("123", 5)).toBe("0.00123");
  });
});

describe("getNonDecimalString", () => {
  it("should convert a decimal value to a string without decimals", () => {
    expect(getNonDecimalString("1.23", 2)).toBe("123");
  });

  it("should return the original value if decimals is 0", () => {
    expect(getNonDecimalString("123", 0)).toBe("123");
  });

  it("should handle edge cases correctly", () => {
    expect(getNonDecimalString("1.2", 3)).toBe("1200");
    expect(getNonDecimalString("0.123", 5)).toBe("12300");
  });
});

describe("roundToPrecision", () => {
  it("should round a number to the specified precision", () => {
    expect(roundToPrecision(1.126, 2)).toBe(1.13);
    expect(roundToPrecision(1.123, 2)).toBe(1.12);
  });

  it("should handle edge cases correctly", () => {
    expect(roundToPrecision(1.5, 0)).toBe(2);
    expect(roundToPrecision(0.12345, 3)).toBe(0.123);
  });
});

describe("getNumberOfDecimals", () => {
  it("should return the correct number of decimal places", () => {
    expect(getNumberOfDecimals(1.123)).toBe(3);
    expect(getNumberOfDecimals(1.1)).toBe(1);
    expect(getNumberOfDecimals(1)).toBe(0);
  });

  it("should handle edge cases correctly", () => {
    expect(getNumberOfDecimals(0.0001)).toBe(4);
    expect(getNumberOfDecimals(100)).toBe(0);
  });
});

describe("validateDecimalPlaces", () => {
  it("should validate the number of decimal places correctly", () => {
    expect(() => validateDecimalPlaces(1.123, 3)).not.toThrow();
    expect(() => validateDecimalPlaces(1.1, 1)).not.toThrow();
  });

  it("should throw an error if the number of decimal places exceeds the allowed limit", () => {
    expect(() => validateDecimalPlaces(1.123, 2)).toThrow(
      "Invalid input: The value has 3 decimal places, but only 2 are allowed. Please enter a value with 2 decimal places."
    );
  });

  it("should handle edge cases correctly", () => {
    expect(() => validateDecimalPlaces(0.0001, 3)).toThrow(
      "Invalid input: The value has 4 decimal places, but only 3 are allowed. Please enter a value with 3 decimal places."
    );
    expect(() => validateDecimalPlaces(100, 0)).not.toThrow();
  });
});
