# @rosen-bridge/sdk-ethereum

## Table of contents

- [@rosen-bridge/sdk-ethereum](#rosen-bridgesdk-ethereum)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Generate Lock Transactions](#generate-lock-transactions)
    - [Constants and Types](#constants-and-types)
    - [Error handling](#error-handling)

## Introduction

This package provides Ethereum chain-specific functionality for the Rosen Bridge SDK, enabling you to interact with and create transactions on the Rosen Bridge for the Ethereum blockchain.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-ethereum
```

yarn:

```sh
yarn add @rosen-bridge/sdk-ethereum
```

## Usage

### Initialize the SDK

To use the SDK, initialize an instance of `EthereumRosenChainSDK` with your token configuration and lock address:

```typescript
import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { EthereumRosenChainSDK } from '@rosen-bridge/sdk-ethereum';
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
    ethereum: {
      tokenId: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      name: 'ETH',
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
    ethereum: {
      tokenId: '0x1234567890123456789012345678901234567890',
      name: 'rsADA',
      decimals: 6,
      type: 'ERC20',
      residency: 'wrapped',
      extra: {},
    },
  },
];

const tokenMap = new TokenMap();
await tokenMap.updateConfigByJson(rosenTokens);

const lockAddress = '0x...'; // Rosen Ethereum lock address

const sdk = new EthereumRosenChainSDK(
  tokenMap, // TokenMap instance
  lockAddress, // Lock address for bridge
  new DummyLogger(), // Optional: logger (e.g., new DummyLogger() or console)
);
```

### Generate Lock Transactions

You can generate an unsigned lock transaction for bridging assets from Ethereum to another chain. The method returns a transaction object that can be passed to a wallet like Metamask to sign and send.

**For native ETH:**

```typescript
const transaction = await sdk.generateLockTransaction(
  'eth', // Token ID on Ethereum ('eth' for native ETH)
  NETWORKS.ERGO, // Target chain
  'toEncodedAddress', // Recipient address on target chain (encoded)
  'fromAddress', // Sender's Ethereum address
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

**For ERC20 tokens:**

```typescript
const transaction = await sdk.generateLockTransaction(
  '0x1234567890123456789012345678901234567890', // ERC20 token address
  NETWORKS.ERGO, // Target chain
  'toEncodedAddress', // Recipient address on target chain (encoded)
  'fromAddress', // Sender's Ethereum address
  1_000_000_000n, // Amount to bridge (in token's smallest unit)
  10_000_000n, // Bridge fee (in token's smallest unit)
  20_000_000n, // Network fee (in token's smallest unit)
);

// The result is a transaction object
console.log(transaction);
// Example output:
// {
//   to: '0x1234567890123456789012345678901234567890', // token address
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
