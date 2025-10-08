# @rosen-bridge/sdk-cardano

## Table of contents

- [@rosen-bridge/sdk-cardano](#rosen-bridgesdk-cardano)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Generate Lock Transactions](#generate-lock-transactions)
    - [Constants and Types](#constants-and-types)
    - [Error handling](#error-handling)

## Introduction

This package provides Cardano chain-specific functionality for the Rosen Bridge SDK, enabling you to interact with and create transactions on the Rosen Bridge for the Cardano blockchain.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-cardano
```

yarn:

```sh
yarn add @rosen-bridge/sdk-cardano
```

## Usage

### Initialize the SDK

To use the SDK, initialize an instance of `CardanoRosenChainSDK` with your token configuration and lock address:

```typescript
import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { CardanoRosenChainSDK } from '@rosen-bridge/sdk-cardano';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
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

const lockAddress = 'addr1qyze7rc'; // Rosen Cardano lock address

const sdk = new CardanoRosenChainSDK(
  tokenMap, // TokenMap instance
  lockAddress, // Lock address for bridge
  undefined, // Optional: estimated max fee (defaults to 400_000n)
  undefined, // Optional: estimated min box value (defaults to 2_000_000n)
  new DummyLogger(), // Optional: logger (e.g., new DummyLogger() or console)
);
```

### Generate Lock Transactions

You can generate an unsigned lock transaction for bridging assets from Cardano to another chain:

```typescript
const unsignedTx = await sdk.generateLockTransaction(
  'tokenId', // Token ID on Cardano (e.g., 'ada' for native ADA)
  NETWORKS.YOUR_TARGET_CHAIN, // Target chain (e.g., NETWORKS.ERGO)
  'toAddress', // Recipient address on target chain
  'fromAddress', // Sender's Cardano address (bech32)
  300_000_000n, // Unwwrapped Amount to bridge (in token's smallest unit)
  3_000_000n, // Unwwrapped Bridge fee
  1_000_000n, // Unwwrapped Network fee
  utxoIterator, // Iterator or async iterator of available Cardano UTXOs
  {
    protocolParams: {
      min_fee_a: 44,
      min_fee_b: 155381,
      pool_deposit: '500000000',
      key_deposit: '2000000',
      max_value_size: 5000,
      max_tx_size: 16384,
      coins_per_utxo_size: '4310',
    },
  }, // Cardano Network Params
);

// The result is a hex string representing the unsigned transaction.
console.log(unsignedTx);
```

- `utxoIterator` should yield Cardano UTXOs covering the required amount.
- The SDK does not sign transactions; you must sign and submit the transaction using your own wallet or tools.

### Constants and Types

The SDK exports several useful constants and types:

- `ESTIMATED_MAX_FEE`: Estimated max fee for Cardano transactions (default: 400_000n)
- `ESTIMATED_MIN_BOX_VALUE`: Estimated minimum value for a Cardano box (default: 2_000_000n)
- Types such as `CardanoUtxo`, `CardanoProtocolParams`, `NetworkParams`, etc., are available for strong typing of transaction data.

### Error handling

The SDK may throw the following error:

- `InsufficientAssetsException`: Thrown if the provided UTXOs do not cover the required amount for the transaction.

Example:

```typescript
import { InsufficientAssetsException } from '@rosen-bridge/sdk-cardano';

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
- Transaction signing is not handled by this SDK; you must provide UTXOs and sign the transaction as appropriate for your application.
