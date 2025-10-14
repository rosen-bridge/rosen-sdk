# @rosen-bridge/sdk-ergo

## Table of contents

- [@rosen-bridge/sdk-ergo](#rosen-bridgesdk-ergo)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Generate Lock Transactions](#generate-lock-transactions)
    - [Constants and Types](#constants-and-types)
    - [Error handling](#error-handling)

## Introduction

This package provides Ergo chain-specific functionality for the Rosen Bridge SDK, enabling you to interact with and create transactions on the Rosen Bridge for the Ergo blockchain.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-ergo
```

yarn:

```sh
yarn add @rosen-bridge/sdk-ergo
```

## Usage

### Initialize the SDK

To use the SDK, initialize an instance of `ErgoRosenChainSDK` with your token configuration and lock address:

```typescript
import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { ErgoRosenChainSDK } from '@rosen-bridge/sdk-ergo';
import { TokenMap } from '@rosen-bridge/tokens';

const rosenTokens = [
  {
    ergo: {
      tokenId: 'erg',
      name: 'ERG',
      decimals: 9,
      type: 'native',
      residency: 'native',
      extra: {},
    },
    cardano: {
      tokenId:
        '04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14.7273455247',
      name: 'rsERG',
      decimals: 9,
      type: 'CIP26',
      residency: 'wrapped',
      extra: {
        policyId: '04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14',
        assetName: '7273455247',
      },
    },
  },
];

const tokenMap = new TokenMap();
await tokenMap.updateConfigByJson(rosenTokens);

const lockAddress = 'nB3L2P...'; // Rosen Ergo lock address

const sdk = new ErgoRosenChainSDK(
  tokenMap, // TokenMap instance
  lockAddress, // Lock address for bridge
  undefined, // Optional: minimum box value (defaults to 400000n)
  undefined, // Optional: transaction fee (defaults to 1000000n)
  console, // Optional: new DummyLogger() or any logger
);
```

### Generate Lock Transactions

You can generate an unsigned lock transaction for bridging assets from Ergo to another chain:

```typescript
const unsignedTx = await sdk.generateLockTransaction(
  'tokenId', // Token ID on Ergo (e.g., 'erg' for native ERG)
  NETWORKS.YOUR_TARGET_CHAIN, // Target chain (e.g., 'cardano')
  'toAddress', // Recipient address on target chain
  'fromAddress', // Sender's Ergo address
  300_000_000n, // Unwwrapped Amount to bridge (in token's smallest unit)
  3_000_000n, // Unwwrapped Bridge fee
  1_000_000n, // Unwwrapped Network fee
  utxoIterator, // Iterator or async iterator of available Ergo UTXOs
  {
    networkHeight: 1599000,
  },
);

// The result is an object containing the unsigned transaction and related data.
console.log(unsignedTx.unsignedTxProxy);
```

### Constants and Types

The SDK exports several useful constants and types:

- `MIN_BOX_VALUE`: Minimum value for an Ergo box (default: 400000n)
- `FEE`: Default transaction fee (default: 1000000n)
- Types such as `UnsignedErgoTxProxy`, `UnsignedGenerateTxProxy`, etc., are available for strong typing of transaction data.

### Error handling

The SDK may throw the following error:

- `InsufficientAssetsException`: Thrown if the provided UTXOs do not cover the required amount for the transaction.

Example:

```typescript
import { InsufficientAssetsException } from '@rosen-bridge/sdk-ergo';

try {
  // ... call generateLockTransaction ...
} catch (e) {
  if (e instanceof InsufficientAssetsException) {
    // Handle insufficient assets
  } else {
    throw e;
  }
}
```

---

**Note:**

- You must provide a realistic token configuration and valid lock address for your environment.
- Transaction signing are not handled by this SDK; you must provide UTXOs and sign the transaction as appropriate for your application.
