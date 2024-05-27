export interface IdKeys {
  ergo: string;
  cardano: string;
}

export interface TokenMap {
  ergo: ErgoToken;
  cardano: CardanoToken;
}

export interface ErgoToken {
  tokenId: string;
  name: string;
  decimals: number;
  metadata: TokenMetadata;
}

export interface CardanoToken {
  tokenId: string;
  policyId: string;
  assetName: string;
  name: string;
  decimals: number;
}

export interface TokenMetadata {
  type: TokenType;
  residency: Residency;
}

export enum Residency {
  native = "native",
  wrapped = "wrapped",
}

export enum TokenType {
  EIPOO4 = "EIP-004",
  CIP26 = "CIP26",
  NATIVE = "native",
}
