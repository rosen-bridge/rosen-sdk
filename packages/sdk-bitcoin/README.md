# @rosen-bridge/sdk-bitcoin

## Table of contents

- [@rosen-bridge/sdk-bitcoin](#rosen-bridgesdk-bitcoin)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Generate Lock Transactions](#generate-lock-transactions)
    - [Constants and Types](#constants-and-types)
    - [Error handling](#error-handling)

## Introduction

This package provides Bitcoin chain-specific functionality for the Rosen Bridge SDK, enabling you to interact with and create transactions on the Rosen Bridge for the Bitcoin blockchain.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-bitcoin
```

yarn:

```sh
yarn add @rosen-bridge/sdk-bitcoin
```

## Usage

### Initialize the SDK

To use the SDK, initialize an instance of `BitcoinRosenChainSDK` with your token configuration and lock address:

```typescript
import { BitcoinRosenChainSDK } from '@rosen-bridge/sdk-bitcoin';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

const rosenTokens = [
  {
    ergo: {
      tokenId:
        'b2dcea48caf0e73309138d659f6eb69d7ec8793dee989670c72dd4ffde7ebeb3',
      name: 'rpnBTC',
      decimals: 8,
      type: 'EIP-004',
      residency: 'wrapped',
      extra: {},
    },
    bitcoin: {
      tokenId: 'btc',
      name: 'BTC',
      decimals: 8,
      type: 'native',
      residency: 'native',
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

const tokenMap = new TokenMap();
await tokenMap.updateConfigByJson(rosenTokens);

const lockAddress = 'bc1q...'; // Rosen Bitcoin lock address

const sdk = new BitcoinRosenChainSDK(
  tokenMap, // TokenMap instance
  lockAddress, // Lock address for bridge
);
```

### Generate Lock Transactions

You can generate an unsigned lock transaction for bridging btc from Bitcoin to another chain:

```typescript
const unsignedTx = await sdk.generateLockTransaction(
  'btc', // Token ID on Bitcoin (only 'btc' is supported)
  NETWORKS.YOUR_TARGET_CHAIN, // Target chain (e.g., NETWORKS.ERGO)
  'toEncodedAddress', // Recipient address on target chain (encoded)
  'fromAddress', // Sender's Bitcoin address (bech32)
  1_500_000n, // Amount to bridge (in satoshis)
  9_551n, // Bridge fee (in satoshis)
  153n, // Network fee (in satoshis)
  utxoIterator, // Iterator or async iterator of available Bitcoin UTXOs
  {
    feeRatio: 4.968, // fee ratio for estimation
  },
);

// The result is an object containing the unsigned PSBT (base64/hex encoded) and related data.
console.log(unsignedTx);
```

- `utxoIterator` should yield Bitcoin UTXOs covering the required amount.
- The SDK does not sign transactions; you must sign and submit the transaction using your own wallet or tools.

### Constants and Types

The SDK exports several useful constants and types:

- Types such as `BitcoinUtxo`, etc., are available for strong typing of transaction data.

### Error handling

The SDK may throw the following errors:

- `UnsupportedTokenException`: Thrown if the provided token is not supported (only 'btc' is supported).
- `InsufficientAssetsException`: Thrown if the provided UTXOs do not cover the required amount for the transaction.

Example:

```typescript
import {
  UnsupportedTokenException,
  InsufficientAssetsException,
} from '@rosen-bridge/sdk-bitcoin';

try {
  // ... call generateLockTransaction ...
} catch (e) {
  if (e instanceof UnsupportedTokenException) {
    // Handle unsupported token
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
- Transaction signing is not handled by this SDK; you must provide UTXOs and sign the transaction as appropriate for your application.
