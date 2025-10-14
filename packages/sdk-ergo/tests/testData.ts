import { ErgoBox } from 'ergo-lib-wasm-nodejs';

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
];

export const ergoLockAddress =
  'nB3L2PD3L6537eX5AD1cyBwCejh2jt8nMhuonRWUSfpS43fakUpHT1uZyioPnVQ5EJdVPPskaWygfdxiDqbv3js6LR4TDkJXpRdKDm3Kk2x1cUmvy1ma9cD9H8tap7rRNWcMnJD75fptM';

export const rawBoxes = [
  {
    boxId: 'f421e4d969ebe2d1f81cab7abdd1e946a275d19d564e12ab0e8612773217c5a4',
    value: '1000000000',
    ergoTree:
      '0008cd02caad8ef6771ad15ebb0a2aa9b7e84b9c48962976061d1af3e73767203d2f2bb1',
    assets: [
      {
        tokenId:
          '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1',
        amount: '100000000',
      },
    ],
    additionalRegisters: {},
    creationHeight: 1499000,
    transactionId:
      'a734000236aecbd8c58254eadb51ce0e5c6ed8d70e1208278fecc9869fe0c130',
    index: 0,
  },
  {
    boxId: 'f5bdbb58b7daaac0acf7ad57ca36c8faf0514624f88cde793b90fc66b3a2615b',
    value: 1000000000,
    ergoTree:
      '0008cd03cc357e707ca91641f11d54ca01f256b7f4a23736f4309f3d6d3d422970a1c3ba',
    assets: [
      {
        tokenId:
          '962862f62ab4ad28cdc59cc321ea1dabd607178e49fcc817b1bbb997fb116375',
        amount: 200,
      },
    ],
    creationHeight: 1400000,
    additionalRegisters: {},
    transactionId:
      'f3aad6819b6a2e855b11d1cff40b06fa9437e5231768088a75e799225007af65',
    index: 0,
  },
  {
    boxId: 'a855b260ed712d37e7aeccb8ec02a179c4f11196a1f9dd54613ec35c33e92f3c',
    value: 1000000000,
    ergoTree:
      '0008cd03cc357e707ca91641f11d54ca01f256b7f4a23736f4309f3d6d3d422970a1c3ba',
    assets: [
      {
        tokenId:
          '962862f62ab4ad28cdc59cc321ea1dabd607178e49fcc817b1bbb997fb116375',
        amount: 200,
      },
    ],
    creationHeight: 1400000,
    additionalRegisters: {},
    transactionId:
      '4c5b9c9ff0872cf72a99791adb3b16a301e3134f2392c0d95669d9765c684063',
    index: 0,
  },
  {
    boxId: '5ba810ab6d0905ad41a147beffe136509c6e4df511331dc8040a1c0432720f79',
    value: '1000000000',
    ergoTree:
      '0008cd02caad8ef6771ad15ebb0a2aa9b7e84b9c48962976061d1af3e73767203d2f2bb1',
    assets: [
      {
        tokenId:
          '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1',
        amount: '250000000',
      },
      {
        tokenId:
          '962862f62ab4ad28cdc59cc321ea1dabd607178e49fcc817b1bbb997fb116375',
        amount: '200',
      },
    ],
    additionalRegisters: {},
    creationHeight: 1499000,
    transactionId:
      'a734000236aecbd8c58254eadb51ce0e5c6ed8d70e1208278fecc9869fe0c130',
    index: 0,
  },
  {
    boxId: '443f5b2594fe334d65ddf2df087e08160e8948354da0f1830906a3ed8f25f682',
    value: '1000000000',
    ergoTree:
      '0008cd0203b404c847a8ed60c6f473cd88c579bc001aea5d45f36d9392b5e438caf1ab6a',
    assets: [
      {
        tokenId:
          'd752bede1a85891fff344604431fd6dc30ba685b382f2e0fe15da8141d36e34e',
        amount: '10000000000',
      },
    ],
    additionalRegisters: {},
    creationHeight: 1499000,
    transactionId:
      'd35a5d49901203b1d920b669652942a66ccf260705aa27482239534fd3641d8a',
    index: 1,
  },
];
export const ergoBoxes = rawBoxes.map((box) =>
  ErgoBox.from_json(JSON.stringify(box)),
);

export const desireChangeBoxAsset = [
  {
    tokenId: '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1',
    amount: '100000000',
  },
];
