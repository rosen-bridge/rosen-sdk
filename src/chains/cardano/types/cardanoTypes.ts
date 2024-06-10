export interface CardanoAsset {
  policyId: string;
  assetName: string;
  quantity: bigint;
}

export interface CardanoUtxo {
  txId: string;
  index: number;
  address: string;
  value: bigint;
  assets: Array<CardanoAsset>;
}

export interface CardanoProtocolParams {
  min_fee_a: number;
  min_fee_b: number;
  pool_deposit: string;
  key_deposit: string;
  max_value_size: number;
  max_tx_size: number;
  coins_per_utxo_size: string;
}
