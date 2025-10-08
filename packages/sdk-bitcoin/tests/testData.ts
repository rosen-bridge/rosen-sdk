import { BitcoinUtxo } from '@rosen-bridge/bitcoin-utxo-selection';
import { RosenTokens } from '@rosen-bridge/tokens';

export const rosenTokens: RosenTokens = [
  {
    ergo: {
      tokenId: 'erg',
      name: 'ERG',
      decimals: 9,
      type: 'native',
      residency: 'native',
      extra: {},
    },
    ethereum: {
      tokenId: '0x96544b7c03c00da7bfddc560351429ee1376f7d8',
      name: 'rpnERG',
      decimals: 9,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
    binance: {
      tokenId: '0xbc152e294a24d777e640e6a491edbd3ca461c51f',
      name: 'rpnERG',
      decimals: 9,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
    cardano: {
      tokenId:
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e455247',
      name: 'rpnERG',
      decimals: 9,
      type: 'CIP26',
      residency: 'wrapped',
      extra: {
        policyId: '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb',
        assetName: '72706e455247',
      },
    },
  },
  {
    ergo: {
      tokenId:
        'd752bede1a85891fff344604431fd6dc30ba685b382f2e0fe15da8141d36e34e',
      name: 'RSN-Pandora',
      decimals: 3,
      type: 'EIP-004',
      residency: 'native',
      extra: {},
    },
    ethereum: {
      tokenId: '0xd56a632afd90e68a4b3147720b1b4e974bca82ad',
      name: 'rpnRSN',
      decimals: 3,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
    cardano: {
      tokenId:
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e52534e',
      name: 'rpnRSN',
      decimals: 3,
      type: 'CIP26',
      residency: 'wrapped',
      extra: {
        policyId: '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb',
        assetName: '72706e52534e',
      },
    },
    binance: {
      tokenId: '0xae7d4d48939d3edcae1b8103a2e01acd3f51ecea',
      name: 'rpnRSN',
      decimals: 3,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
  },
  {
    bitcoin: {
      tokenId: 'btc',
      name: 'BTC',
      decimals: 8,
      type: 'native',
      residency: 'native',
      extra: {},
    },
    ethereum: {
      tokenId: '0x90f5aac524f21c669e863c9dccdd90be3f5e70c8',
      name: 'rpnBTC',
      decimals: 8,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
    ergo: {
      tokenId:
        'b2dcea48caf0e73309138d659f6eb69d7ec8793dee989670c72dd4ffde7ebeb3',
      name: 'rpnBTC',
      decimals: 8,
      type: 'EIP-004',
      residency: 'wrapped',
      extra: {},
    },
    binance: {
      tokenId: '0x6c0694e681f97f2a3c86202ee9221bdfd6198578',
      name: 'rpnBTC',
      decimals: 8,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
    cardano: {
      tokenId:
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e425443',
      name: 'rpnBTC',
      decimals: 8,
      type: 'CIP26',
      residency: 'wrapped',
      extra: {
        policyId: '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb',
        assetName: '72706e425443',
      },
    },
  },
];

export const bitcoinLockAddress = 'bc1q0eqaazqyy2agxn74z6ch6a7f0t2hvekd5p9xqk';

export const bitcoinUtxos: BitcoinUtxo[] = [
  {
    txId: '6699c2b892da307f8e3bf9329e9b17b397a7aff525f4caa8d05507b73a8392b5',
    index: 0,
    value: 3000000n,
  },
];

export const rosenDataBtcBridge = {
  toChain: 'ergo',
  toAddress: '9hBEAVZ9MHLf7mwVrvP3nqptdqYVdYGu1byPH8XFzC7KDuzrb8W',
  bridgeFee: '9551',
  networkFee: '153',
};
