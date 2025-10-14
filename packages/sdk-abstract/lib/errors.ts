import JsonBigInt from '@rosen-bridge/json-bigint';
import { AssetBalance } from '@rosen-bridge/selection-types';

export class InsufficientAssetsException extends Error {
  constructor(assetBalance?: AssetBalance) {
    super(
      `Available boxes didn't cover required assets. Uncovered assets: ${assetBalance ? JsonBigInt.stringify(assetBalance) : undefined}`,
    );
  }
}

export class EmptyTokenMapException extends Error {
  constructor() {
    super(`Token map is empty`);
  }
}
