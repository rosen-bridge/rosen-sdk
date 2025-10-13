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
];

export const dogecoinLockAddress = 'DLTNKs5wjwAXC2AMV7FjndYoFaRREsoyRm';

export const rosenDataDogeBridge = {
  toChain: 'ergo',
  toAddress: '9hBEAVZ9MHLf7mwVrvP3nqptdqYVdYGu1byPH8XFzC7KDuzrb8W',
  bridgeFee: '2500000',
  networkFee: '2000000',
};

export const dogecoinUtxos = [
  {
    txId: 'a2623a8e6358b44df7c672cee5a6ff1df2b45721b2f506d22ef59a0634f7641d',
    index: 0,
    value: 500000000n,
    txHex:
      '01000000017af0d5f7b6fc3aa277e54a16f372f71e33cf9fb3632227397a1715008fb05836010000006b48304502210081c051556843abc8bfec58fd8bb6a9600f32944bf1d071998b16c42b399e7bb702200ab5c55de9a43967fe7c7f7726fabe2a34b097eb4223c4440d2dffab7e43d0c50121022b9ed0a9139042921decc62603a4a07357b444da2e0bd6a96c27155117913037ffffffff030065cd1d000000001976a914872b67c8270a9eaf5c2abf632af3dea989d2e37188ac00000000000000000e6a0c48656c6c6f20526f73656e21480752bc030000001976a914872b67c8270a9eaf5c2abf632af3dea989d2e37188ac00000000',
  },
  {
    txId: 'f7fdbfcb582dd9e34997df257bfff291c1ea98a5622ba18400794f3337113b0e',
    index: 2,
    value: 12134394312n,
    txHex:
      '02000000015de5e7ecd6c60bf37591d4c23a6747644040b71edbe209231542c848c7ef737f020000006a473044022069ef1e50e6cd355179f68cdf42e7f68ff442a005b4906f40aa846d945208eaf1022037ce2ecc0c294eb46f875bac50edffbe610247a2769c5dc2ad8e8f18f6155daf0121022b9ed0a9139042921decc62603a4a07357b444da2e0bd6a96c27155117913037ffffffff030000000000000000356a33000000000005f5e10000000000009896802103e5bedab3f782ef17a73e9bdc41ee0e18c3ab477400f35bcf7caa54171db7ff3600e1f505000000001976a9145d0e02100e393220f90ffce4485f809de4ff777c88acc82944d3020000001976a914872b67c8270a9eaf5c2abf632af3dea989d2e37188ac00000000',
  },
];

export const txToHex: Record<string, string> = Object.fromEntries(
  dogecoinUtxos.map((value) => [value.txId, value.txHex]),
);
