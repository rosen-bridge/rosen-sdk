import { RosenTokens } from '@rosen-bridge/tokens';

export const rosenTokens: RosenTokens = [
  {
    doge: {
      tokenId: 'doge',
      name: 'DOGE',
      decimals: 8,
      type: 'native',
      residency: 'native',
      extra: {},
    },
    ergo: {
      tokenId:
        '21d2cd3c488d530bb7d2c8f3e9c1f495ee5a4f30ab798b83b481c978ece75f83',
      name: 'rpnDoge',
      decimals: 6,
      type: 'EIP-004',
      residency: 'wrapped',
      extra: {},
    },
    ethereum: {
      tokenId: '0xc864ddd4ae02d8fea194016e76ff5ab77c8aa769',
      name: 'rpnDoge',
      decimals: 6,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
    binance: {
      tokenId: '0xfa0f85673a4a83ea19d09448e02f3f98e82f1a6d',
      name: 'rpnDoge',
      decimals: 6,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
    cardano: {
      tokenId:
        '92210c500a405bc2c2b6c9666fe74cb4f2ac26251968e3e779887b63.72706e446f6765',
      name: 'rpnDoge',
      decimals: 6,
      type: 'CIP26',
      residency: 'wrapped',
      extra: {
        policyId: '92210c500a405bc2c2b6c9666fe74cb4f2ac26251968e3e779887b63',
        assetName: '72706e446f6765',
      },
    },
  },
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
    ethereum: {
      tokenId: 'eth',
      name: 'ETH',
      decimals: 18,
      type: 'native',
      residency: 'native',
      extra: {},
    },
    ergo: {
      tokenId:
        '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1',
      name: 'rpnETH',
      decimals: 9,
      type: 'EIP-004',
      residency: 'wrapped',
      extra: {},
    },
    cardano: {
      tokenId:
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e455448',
      name: 'rpnETH',
      decimals: 9,
      type: 'CIP26',
      residency: 'wrapped',
      extra: {
        policyId: '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb',
        assetName: '72706e455448',
      },
    },
    binance: {
      tokenId: '0x96cb997a115b7f57bd144ef4d1e8a68194444e91',
      name: 'rpnETH',
      decimals: 18,
      type: 'ERC-20',
      residency: 'wrapped',
      extra: {},
    },
  },
];

export const ergoLockAddress =
  'nB3L2PD3L6537eX5AD1cyBwCejh2jt8nMhuonRWUSfpS43fakUpHT1uZyioPnVQ5EJdVPPskaWygfdxiDqbv3js6LR4TDkJXpRdKDm3Kk2x1cUmvy1ma9cD9H8tap7rRNWcMnJD75fptM';

export const cardanoLockAddress =
  'addr1vxgffjagh2zfzdtzm2xmgw7l6gpnl075u0rhzy0l3dm3lvc4c8lgh';

export const ethereumLockAddress = '0x251a4249d853a92db1f8efee44c36c43ab89c7e0';
