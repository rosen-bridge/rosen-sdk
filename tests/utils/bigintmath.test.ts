import { it, assert, describe } from "vitest";
import { BigIntMath } from "../../src/utils/bigintmath";

describe("BigIntMath", () => {
  it("max", () => {
    assert.equal(BigIntMath.max(100n, 10n), 100n);
    assert.equal(BigIntMath.max(10n, 100n), 100n);
    assert.equal(BigIntMath.max(100n, 100n), 100n);
  });

  it("ceil", () => {
    assert.equal(BigIntMath.ceil(120n, 3n), 40n);
    assert.equal(BigIntMath.ceil(121n, 3n), 41n);
    assert.equal(BigIntMath.ceil(122n, 3n), 41n);
  });

  it("floor", () => {
    assert.equal(BigIntMath.floor(120n, 3n), 40n);
    assert.equal(BigIntMath.floor(121n, 3n), 40n);
    assert.equal(BigIntMath.floor(122n, 3n), 40n);
  });

  it("pow", () => {
    assert.equal(BigIntMath.pow(10n, 3n), 1000n);
    assert.equal(BigIntMath.pow(2n, 2n), 4n);
  });
});
