import { BitcoinRunesUtxo } from '@rosen-bridge/bitcoin-runes-utxo-selection';
import { RosenTokens } from '@rosen-bridge/tokens';

// output layout of a bitcoin runes lock transaction
export const CHANGE_OUTPUT_INDEX = 0;
export const RUNESTONE_OUTPUT_INDEX = 1;
export const LOCK_OUTPUT_INDEX = 2;
export const FIRST_DATA_OUTPUT_INDEX = 3;
// the lock data of the test transfers is split into 3 chunks
const DATA_OUTPUTS_COUNT = 3;
export const OUTPUTS_COUNT = FIRST_DATA_OUTPUT_INDEX + DATA_OUTPUTS_COUNT;

/**
 * a subset of the pandora tokens map (contract release 7.1.0-469c742) containing
 * only the token sets that exist on the bitcoin runes chain
 */
export const rosenTokens: RosenTokens = [
  {
    'bitcoin-runes': {
      tokenId: '914209:2664',
      name: 'PYTHAGORAS',
      decimals: 3,
      type: 'Runes',
      residency: 'native',
      extra: {
        uniqueName: 'PYTHAGORAS',
      },
    },
    ergo: {
      tokenId:
        'ea94bcd86000d85518ae4fd9ec328018e4be9eee4d1081e3c42746c5bf62c352',
      name: 'rpnPyth',
      decimals: 1,
      type: 'EIP-004',
      residency: 'wrapped',
      extra: {},
    },
    cardano: {
      tokenId:
        '3165be65a0d4c496d0e77e7569618240da85135ed35f32db212cc935.72706e50797468',
      name: 'rpnPyth',
      decimals: 1,
      type: 'CIP26',
      residency: 'wrapped',
      extra: {
        policyId: '3165be65a0d4c496d0e77e7569618240da85135ed35f32db212cc935',
        assetName: '72706e50797468',
      },
    },
  },
  {
    'bitcoin-runes': {
      tokenId: '915909:3639',
      name: 'RPN•CARDANO•ADA',
      decimals: 6,
      type: 'Runes',
      residency: 'wrapped',
      extra: {
        uniqueName: 'RPNCARDANOADA',
      },
    },
    cardano: {
      tokenId: 'ada',
      name: 'ADA',
      decimals: 6,
      type: 'native',
      residency: 'native',
      extra: {
        policyId: '',
        assetName: '414441',
      },
    },
    ergo: {
      tokenId:
        '08779df8d22fe096de6b382264af0ed6859326a47212484fffffe3fb212d7a1f',
      name: 'rpnADA',
      decimals: 6,
      type: 'EIP-004',
      residency: 'wrapped',
      extra: {},
    },
  },
];

export const pythagorasRuneId = '914209:2664';
export const adaRuneId = '915909:3639';

export const bitcoinRunesLockAddress =
  'bc1qkpxh7l6g7tmtnl70e6eqt4yv3y6uzsvvymjj4v';

export const nativeSegwitAddress = 'bc1qwu6zk52mz9wyy62ktdahuxqzmqd8xzxa92gk73';

export const taprootAddress =
  'bc1px0ad45qrfwc20yfd9wljeytrvfa6tmrcxv6pgxze2svvx00tp7mstj5rpk';
export const taprootInternalPubkey =
  '49273bdf5b4d4594ef73377e249166579adf6f4bf18f9b23db309416ad1ee4f5';

export const secondTaprootAddress =
  'bc1p2d7wd8k0kqudmne4jtv8x365lk23zhjzlx3tyaav0658tvgtjw5q4yus9q';
export const secondTaprootInternalPubkey =
  '2b12644e9a4bc7bc810a59573dfa3363555e05efae44b0045c28fcbde34c3b44';

export const legacyAddress = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';

export const taprootScriptInfo = new Map([
  [taprootAddress, taprootInternalPubkey],
  [secondTaprootAddress, secondTaprootInternalPubkey],
]);

export const nativeSegwitUtxos: BitcoinRunesUtxo[] = [
  {
    txId: 'd1797fa384ada5953128474f397b31d18681376fb542e24c2e1f79ee94799637',
    index: 0,
    value: 50000n,
    runes: [{ runeId: pythagorasRuneId, quantity: 5500000n }],
    address: nativeSegwitAddress,
  },
];

export const taprootUtxos: BitcoinRunesUtxo[] = [
  {
    txId: 'b5083b8cf78c5614228c64fe49f2372f1e3dd04fd836ee34054bd578abca5a76',
    index: 2,
    value: 50000n,
    runes: [{ runeId: pythagorasRuneId, quantity: 5500000n }],
    address: taprootAddress,
  },
];

/**
 * two utxos, both required to cover the transfer: the rune carrying one holds
 * the dust limit only, so a second utxo is needed for the satoshi requirements
 */
export const mixedAddressUtxos: BitcoinRunesUtxo[] = [
  {
    txId: 'ecbcf2c087f0a884147d98a0775c1e3bc77ee7ea924c57d204b2d653c4f54bdf',
    index: 0,
    value: 294n,
    runes: [{ runeId: pythagorasRuneId, quantity: 5500000n }],
    address: taprootAddress,
  },
  {
    txId: '805b71cde3d19223fabf9bb84cb3bb2132e0eb002de7dd9278ea62529e64f7be',
    index: 0,
    value: 50000n,
    runes: [],
    address: nativeSegwitAddress,
  },
];

/**
 * two utxos of the same address, both required to cover the transfer
 */
export const sameAddressUtxos: BitcoinRunesUtxo[] = [
  {
    txId: 'ecbcf2c087f0a884147d98a0775c1e3bc77ee7ea924c57d204b2d653c4f54bdf',
    index: 0,
    value: 294n,
    runes: [{ runeId: pythagorasRuneId, quantity: 5500000n }],
    address: nativeSegwitAddress,
  },
  {
    txId: '805b71cde3d19223fabf9bb84cb3bb2132e0eb002de7dd9278ea62529e64f7be',
    index: 0,
    value: 50000n,
    runes: [],
    address: nativeSegwitAddress,
  },
];

/**
 * utxos holding the required runes but not enough satoshi to cover the
 * lock data outputs and the tx fee
 */
export const insufficientUtxos: BitcoinRunesUtxo[] = [
  {
    txId: 'f1a4e36e4ef51229311b08e8baafe81adeac3dcf727e398cacce4e164e807c46',
    index: 0,
    value: 294n,
    runes: [{ runeId: pythagorasRuneId, quantity: 5500000n }],
    address: nativeSegwitAddress,
  },
];

export const invalidAddressUtxos: BitcoinRunesUtxo[] = [
  {
    txId: 'f5bbba081d873f9567fddfc2db7723b1463640bd7e1966a2f7ba977138d92d98',
    index: 0,
    value: 50000n,
    runes: [{ runeId: pythagorasRuneId, quantity: 5500000n }],
    address: legacyAddress,
  },
];

export const adaRuneUtxos: BitcoinRunesUtxo[] = [
  {
    txId: 'a5bf2381f20a1c232a393f0361024b3b0e62da7e79362c68229755e00f7ced0f',
    index: 2,
    value: 50000n,
    runes: [{ runeId: adaRuneId, quantity: 5500000n }],
    address: nativeSegwitAddress,
  },
];

/**
 * PYTHAGORAS has 3 decimals on bitcoin runes and 1 significant decimal, so the
 * fees are divided by 100 and rounded up before being written into the lock data
 */
export const rosenDataRuneBridge = {
  toChain: 'ergo',
  toAddress: '9hBEAVZ9MHLf7mwVrvP3nqptdqYVdYGu1byPH8XFzC7KDuzrb8W',
  bridgeFee: '9551',
  networkFee: '153',
  wrappedBridgeFee: '96',
  wrappedNetworkFee: '2',
};

/**
 * RPN•CARDANO•ADA has 6 decimals on every chain of its token set, so the fees
 * are written into the lock data unchanged
 */
export const rosenDataAdaRuneBridge = {
  toChain: 'cardano',
  toAddress:
    'addr1qydjalm0r8dfc7r2t0jjnphyl2ygw4853lwgycusw0jtnqnuhf3zfkz57qx7j3pgluqzfc5h44dtwuapnmt04jqvgr0qwd9mqk',
  bridgeFee: '9551',
  networkFee: '153',
};

export const networkParams = {
  feeRatio: 2,
  taprootScriptInfo,
};
