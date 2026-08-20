# @rosen-bridge/sdk-bitcoin-runes

## Table of contents

- [@rosen-bridge/sdk-bitcoin-runes](#rosen-bridgesdk-bitcoin-runes)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Generate Lock Transactions](#generate-lock-transactions)
    - [Signing the transaction](#signing-the-transaction)
    - [Constants and Types](#constants-and-types)
    - [Error handling](#error-handling)

## Introduction

This package provides Bitcoin Runes chain-specific functionality for the Rosen Bridge SDK, enabling you to interact with and create transactions on the Rosen Bridge for runes issued on the Bitcoin blockchain.

Unlike `@rosen-bridge/sdk-bitcoin`, which bridges only BTC, this package bridges only runes. BTC itself is not a bridgeable asset on this chain and is used solely to fund the outputs and the transaction fee.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-bitcoin-runes
```

yarn:

```sh
yarn add @rosen-bridge/sdk-bitcoin-runes
```

## Usage

### Initialize the SDK

To use the SDK, initialize an instance of `BitcoinRunesRosenChainSDK` with your token configuration and lock address:

```typescript
import { BitcoinRunesRosenChainSDK } from '@rosen-bridge/sdk-bitcoin-runes';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

const rosenTokens = [
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
];

const tokenMap = new TokenMap();
await tokenMap.updateConfigByJson(rosenTokens);

const lockAddress = 'bc1q...'; // Rosen Bitcoin Runes lock address

const sdk = new BitcoinRunesRosenChainSDK(
  tokenMap, // TokenMap instance
  lockAddress, // Lock address for bridge
);
```

The token id of a rune is its rune id, i.e. `<etchingBlockHeight>:<etchingTxIndex>`.

### Generate Lock Transactions

You can generate an unsigned lock transaction for bridging a rune from Bitcoin to another chain:

```typescript
const unsignedTx = await sdk.generateLockTransaction(
  '914209:2664', // Rune id on Bitcoin Runes (BTC is not supported)
  NETWORKS.YOUR_TARGET_CHAIN, // Target chain (e.g., NETWORKS.ERGO)
  'toEncodedAddress', // Recipient address on target chain (encoded)
  'fromAddress', // Sender's Bitcoin address (native segwit or taproot)
  100_000n, // Amount of the rune to bridge (in its smallest unit)
  9_551n, // Bridge fee (in the smallest unit of the rune)
  153n, // Network fee (in the smallest unit of the rune)
  utxoIterator, // Iterator or async iterator of available Bitcoin Runes UTxOs
  {
    feeRatio: 4.968, // fee ratio for estimation
    taprootScriptInfo: new Map([
      // taproot address -> its x-only internal public key (hex)
      [
        'bc1p...',
        '49273bdf5b4d4594ef73377e249166579adf6f4bf18f9b23db309416ad1ee4f5',
      ],
    ]),
  },
);

// The result is an object containing the unsigned PSBT (base64/hex encoded) and related data.
console.log(unsignedTx);
```

- `fromAddress` and the address of every UTxO must be either native segwit (`bc1q...`) or taproot (`bc1p...`). Legacy and nested segwit addresses are rejected.
- `utxoIterator` should yield UTxOs covering both the rune amount and the satoshi required by the outputs and the fee. Each UTxO carries the runes it holds:

  ```ts
  export interface BitcoinRunesUtxo {
    txId: string;
    index: number;
    value: bigint; // in satoshis
    runes: Array<{ runeId: string; quantity: bigint }>;
    address?: string;
  }
  ```

- `taprootScriptInfo` must contain an entry for every taproot address among the selected UTxOs, and for `fromAddress` when it is a taproot address. It is not needed when all the involved addresses are native segwit.
- The SDK does not sign transactions; you must sign and submit the transaction using your own wallet or tools.

### Signing the transaction

The returned value is an `UnsignedPsbtData`:

```ts
export interface UnsignedPsbtData {
  psbt: string; // base64 encoded PSBT
  psbtHex: string; // hex encoded PSBT
  signInputs: Record<string, number[]>; // address -> indexes of the inputs spent from it
}
```

Since the inputs of a lock transaction may be spent from more than one address, `signInputs` tells which inputs each address has to sign. This maps directly onto the `toSignInputs` argument of the common Bitcoin wallet APIs.

### Constants and Types

The SDK exports several useful constants and types:

- Types such as `BitcoinRunesUtxo`, `NetworkParams` and `UnsignedPsbtData` are available for strong typing of transaction data.
- Constants such as `MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT` and `MINIMUM_BTC_FOR_TAPROOT_OUTPUT` expose the dust limits used while building the transaction.

### Error handling

The SDK may throw the following errors:

- `UnsupportedTokenException`: Thrown if the provided token is BTC, which is not bridgeable on this chain.
- `InvalidAddressException`: Thrown if `fromAddress` is neither a native segwit nor a taproot address.
- `InvalidUtxoException`: Thrown if a UTxO has no address, or its address is neither native segwit nor taproot.
- `InvalidTaprootInfoException`: Thrown if a taproot UTxO is selected but its internal public key is missing from `taprootScriptInfo`.
- `InsufficientAssetsException`: Thrown if the provided UTxOs do not cover the required rune amount or satoshi for the transaction.
- `InvalidChunkDataException`: Thrown if the rosen data cannot be split into chunks.

Example:

```typescript
import {
  InsufficientAssetsException,
  InvalidAddressException,
  InvalidTaprootInfoException,
  UnsupportedTokenException,
} from '@rosen-bridge/sdk-bitcoin-runes';

try {
  // ... call generateLockTransaction ...
} catch (e) {
  if (e instanceof UnsupportedTokenException) {
    // Handle unsupported token
  } else if (e instanceof InvalidAddressException) {
    // Handle unsupported source address type
  } else if (e instanceof InvalidTaprootInfoException) {
    // Handle missing taproot internal public key
  } else if (e instanceof InsufficientAssetsException) {
    // Handle insufficient assets
  } else {
    throw e;
  }
}
```

---

**Note:**

- You must provide a realistic token configuration and valid lock address for your environment.
- Transaction signing is not handled by this SDK; you must provide UTxOs and sign the transaction as appropriate for your application.
- This package initializes `bitcoinjs-lib` with an elliptic curve implementation (`@bitcoinerlab/secp256k1`) on import, since taproot payments require one.
