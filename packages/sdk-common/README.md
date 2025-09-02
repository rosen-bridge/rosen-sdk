# @rosen-bridge/sdk-common

## Table of contents

- [@rosen-bridge/sdk-common](#rosen-bridgesdk-common)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Initialize the SDK](#initialize-the-sdk)
    - [Query chains and tokens](#query-chains-and-tokens)
    - [Fee utilities](#fee-utilities)
    - [Error handling](#error-handling)

## Introduction

This project includes common functions that clients require to interact with and create transactions on Rosen Bridge.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-common
```

yarn:

```sh
yarn add @rosen-bridge/sdk-common
```

## Usage

### Initialize the SDK

Initialize the singleton with your token config and minimum fee NFT parameters.

```typescript
import { RosenUserInterface } from '@rosen-bridge/sdk-common';
import { DummyLogger } from '@rosen-bridge/abstract-logger';
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

const sdkInterface = new RosenUserInterface(
  tokenMap, // TokenMap
  'minimumFeeNFT-box-nft', // Minimum fee NFT id
  'explorer', // Ergo network type: 'explorer' | 'node'
  'https://explorer.ergoplatform.com', // Node/explorer API base URL used by minimum-fee reader
  new DummyLogger(), // Optional logger
);
```

### Query chains and tokens

- Get the list of supported chains:

```typescript
const chains = sdkInterface.getSupportedChains(); // e.g. ['ergo', 'cardano']
```

- Get supported tokens on a specific chain:

```typescript
const ergoTokens = sdkInterface.getChainSupportedTokens('ergo');
```

- Find which chains support a token from a given chain:

```typescript
const chainsForToken = sdkInterface.getAvailableChainsForToken('ergo', 'erg');
```

- Get token details on a target chain:

```typescript
const adaOnCardano = sdkInterface.getTokenDetailsOnTargetChain(
  'ergo',
  'erg',
  'cardano',
);
```

### Fee utilities

- Minimum transferable amount for a token, considering bridge and network fees:

```typescript
const minAmount = await sdkInterface.getMinimumTransferAmountForToken(
  'ergo', // fromChain
  'cardano', // toChain
  'erg', // tokenId on fromChain
  1234567, // current height on fromChain
);
```

- Calculate bridge and network fee for a given transfer amount:

```typescript
const { bridgeFee, networkFee } = await sdkInterface.getFeeByTransferAmount(
  'ergo', // fromChain
  'erg', // tokenId
  'cardano', // toChain
  1234567, // height on fromChain
  1000000000n, // actualAmount in asset unit (ERG in this example)
  200000n, // optional: recommended base network fee on toChain native unit
);
```

- Convert a base network fee from target chain native unit into a token’s asset unit:

```typescript
const feeInAssetUnit = await sdkInterface.convertFeeToAssetUnit(
  'erg', // tokenId on fromChain
  'cardano', // toChain
  'ergo', // fromChain
  1234567, // height on toChain
  200000n, // base network fee in toChain native unit
);
```

### Error handling

These exceptions can be thrown by the SDK and are re-exported:

- TokenNotFoundException
- ChainNotSupportedException
- FeeRetrievalFailureException
- ImpossibleBehaviorException

```

Note:
- You should pass a realistic tokens configuration for your environment.
- Use your actual minimum-fee NFT and network URL for correct fee retrieval.
```
