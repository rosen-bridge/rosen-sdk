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
