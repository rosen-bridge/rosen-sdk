export enum NETWORKS {
  ERGO = 'ergo',
  CARDANO = 'cardano',
  ETHEREUM = 'ethereum',
  BINANCE = 'binance',
  BITCOIN = 'bitcoin',
  DOGE = 'doge',
}

export const NATIVE_TOKEN_IDS = {
  [NETWORKS.ERGO]: 'erg',
  [NETWORKS.CARDANO]: 'ada',
  [NETWORKS.ETHEREUM]: 'eth',
  [NETWORKS.BINANCE]: 'bnb',
  [NETWORKS.BITCOIN]: 'btc',
  [NETWORKS.DOGE]: 'doge',
};

export const NETWORKS_INDEX = {
  [NETWORKS.ERGO]: 0,
  [NETWORKS.CARDANO]: 1,
  [NETWORKS.ETHEREUM]: 3,
  [NETWORKS.BINANCE]: 4,
  [NETWORKS.BITCOIN]: 2,
  [NETWORKS.DOGE]: 5,
};
