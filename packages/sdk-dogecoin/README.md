# @rosen-bridge/sdk-dogecoin

## Table of contents

- [@rosen-bridge/sdk-dogecoin](#rosen-bridgesdk-dogecoin)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Generate Lock Transactions](#generate-lock-transactions)
    - [Constants and Types](#constants-and-types)
    - [Error handling](#error-handling)

## Introduction

This package provides Dogecoin chain-specific functionality for the Rosen Bridge SDK, enabling you to interact with and create transactions on the Rosen Bridge for the Dogecoin blockchain.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-dogecoin
```

yarn:

```sh
yarn add @rosen-bridge/sdk-dogecoin
```

## Usage

### Initialize the SDK

To use the SDK, initialize an instance of `DogecoinRosenChainSDK` with your token configuration and lock address:

```typescript
import { DogecoinRosenChainSDK } from '@rosen-bridge/sdk-dogecoin';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

const rosenTokens = [
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

const tokenMap = new TokenMap();
await tokenMap.updateConfigByJson(rosenTokens);

const lockAddress = 'DLTNK...'; // Rosen Doge lock address

const sdk = new DogecoinRosenChainSDK(
  tokenMap, // TokenMap instance
  lockAddress, // Lock address for bridge
);
```

### Generate Lock Transactions

You can generate an unsigned lock transaction for bridging doge from Dogecoin to another chain:

```typescript
const unsignedTx = await sdk.generateLockTransaction(
  'doge', // Token ID on Dogecoin (only 'doge' is supported)
  NETWORKS.YOUR_TARGET_CHAIN, // Target chain (e.g., NETWORKS.ERGO)
  'toEncodedAddress', // Recipient address on target chain (encoded)
  'fromAddress', // Sender's Dogecoin address
  1_500_000n, // Amount to bridge
  9_551n, // Bridge fee
  153n, // Network fee
  utxoIterator, // Iterator or async iterator of available Dogecoin UTxOs
  {
    feeRatio: 4.968, // fee ratio for estimation,
    txToHex: Record<string, string>, // Map of transaction IDs to their hex representation for nonWitnessUtxo
  },
);

// The result is an object containing the unsigned PSBT (base64/hex encoded) and related data.
console.log(unsignedTx);
```

- `utxoIterator` should yield Dogecoin UTxOs covering the required amount.
- The SDK does not sign transactions; you must sign and submit the transaction using your own wallet or tools.

### Constants and Types

The SDK exports several useful constants and types:

- Types such as `DogecoinUtxo`, etc., are available for strong typing of transaction data.

### Error handling

The SDK may throw the following errors:

- `UnsupportedTokenException`: Thrown if the provided token is not supported (only 'doge' is supported).
- `MissingNonWitnessUtxoError`: Thrown if a non-witness UTxO is required but not provided hex of tx.

Example:

```typescript
import {
  UnsupportedTokenException,
  MissingNonWitnessUtxoError,
} from '@rosen-bridge/sdk-dogecoin';

try {
  // ... call generateLockTransaction ...
} catch (e) {
  if (e instanceof UnsupportedTokenException) {
    // Handle unsupported token
  } else if (e instanceof MissingNonWitnessUtxoError) {
    // Handle missing non-witness UTXO
  } else {
    throw e;
  }
}
```

---

**Note:**

- You must provide a realistic token configuration and valid lock address for your environment.
- Transaction signing is not handled by this SDK; you must provide UTxOs and sign the transaction as appropriate for your application.
