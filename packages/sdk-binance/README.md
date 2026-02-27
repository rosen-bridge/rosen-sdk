# @rosen-bridge/sdk-binance

## Table of contents

- [@rosen-bridge/sdk-binance](#rosen-bridgesdk-binance)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Generate Lock Transactions](#generate-lock-transactions)
    - [Constants and Types](#constants-and-types)
    - [Error handling](#error-handling)

## Introduction

This package provides Binance chain-specific functionality for the Rosen Bridge SDK, enabling you to interact with and create transactions on the Rosen Bridge for the Binance Smart Chain.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-binance
```

yarn:

```sh
yarn add @rosen-bridge/sdk-binance
```

## Usage

### Initialize the SDK

To use the SDK, initialize an instance of `BinanceRosenChainSDK` with your token configuration and lock address:

```typescript
import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { BinanceRosenChainSDK } from '@rosen-bridge/sdk-binance';
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
    binance: {
      tokenId: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      name: 'BNB',
      decimals: 18,
      type: 'native',
      residency: 'native',
      extra: {},
    },
  },
  {
    ergo: {
      tokenId:
        '00352535a0914c311a6a68f18e9e1444d03e63a13a040b2a0c1a938886d38a4c',
      name: 'rsADA',
      decimals: 6,
      type: 'EIP-004',
      residency: 'wrapped',
      extra: {},
    },
    binance: {
      tokenId: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      name: 'rsADA',
      decimals: 6,
      type: 'BEP20',
      residency: 'wrapped',
      extra: {},
    },
  },
];

const tokenMap = new TokenMap();
await tokenMap.updateConfigByJson(rosenTokens);

const lockAddress = '0x...'; // Rosen Binance lock address

const sdk = new BinanceRosenChainSDK(
  tokenMap, // TokenMap instance
  lockAddress, // Lock address for bridge
  new DummyLogger(), // Optional: logger (e.g., new DummyLogger() or console)
);
```

### Generate Lock Transactions

You can generate an unsigned lock transaction for bridging assets from Binance Smart Chain to another chain. The method returns a transaction object that can be passed to a wallet like Metamask to sign and send.

**For native BNB:**

```typescript
const transaction = await sdk.generateLockTransaction(
  'bnb', // Token ID on Binance ('bnb' for native BNB)
  NETWORKS.ERGO, // Target chain
  'toEncodedAddress', // Recipient address on target chain (encoded)
  'fromAddress', // Sender's Binance address
  1_000_000_000_000_000_000n, // Amount to bridge (in wei)
  10_000_000_000_000_000n, // Bridge fee (in wei)
  20_000_000_000_000_000n, // Network fee (in wei)
);

// The result is a transaction object
console.log(transaction);
// Example output:
// {
//   to: '0x...', // lock address
//   data: '0x...', // rosen data
//   value: '0xde0b6b3a7640000', // amount in hex
//   from: 'fromAddress'
// }
```

**For BEP20 tokens:**

```typescript
const transaction = await sdk.generateLockTransaction(
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // BEP20 token address
  NETWORKS.ERGO, // Target chain
  'toEncodedAddress', // Recipient address on target chain (encoded)
  'fromAddress', // Sender's Binance address
  1_000_000_000n, // Amount to bridge (in token's smallest unit)
  10_000_000n, // Bridge fee (in token's smallest unit)
  20_000_000n, // Network fee (in token's smallest unit)
);

// The result is a transaction object
console.log(transaction);
// Example output:
// {
//   to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // token address
//   data: '0x...', // transfer call data + rosen data
//   from: 'fromAddress'
// }
```

- The SDK does not sign transactions; you must sign and submit the transaction using your own wallet or tools.

### Constants and Types

The SDK inherits from `@rosen-bridge/sdk-evm` and uses types from it.

- `EvmTxType`: The type of the transaction object returned by `generateLockTransaction`.

### Error handling

The SDK may throw the following errors:

- `EmptyTokenMapException`: Thrown if the token map is empty when generating a transaction.
- `UnsupportedTokenException`: Thrown if the provided token is not supported by the token map.

Example:

```typescript
import { EmptyTokenMapException } from '@rosen-bridge/sdk-abstract';
import { UnsupportedTokenException } from '@rosen-bridge/tokens';

try {
  // ... call generateLockTransaction ...
} catch (e) {
  if (e instanceof UnsupportedTokenException) {
    // Handle unsupported token
  } else if (e instanceof EmptyTokenMapException) {
    // Handle empty token map
  } else {
    throw e;
  }
}
```

---

**Note:**

- You must provide a realistic token configuration and valid lock address for your environment.
- Transaction signing is not handled by this SDK; you must sign the transaction as appropriate for your application.
