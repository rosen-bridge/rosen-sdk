# RosenChain SDK Documentation

## Overview

The RosenChain SDK (`@rosen/sdk`) provides a set of tools and functions to interact with multiple blockchain networks, including Ergo, Cardano, and Bitcoin. This SDK enables developers to utilize Rosen-Bridge as an underlying technology to transfer assets between blockchain networks.

## Installation

To install the RosenChain SDK, use the following command:

```bash
npm install @rosen/sdk
```

## Getting Started

### Importing the SDK

To use the SDK, import the necessary modules into your project:

```typescript
import {
  ErgoRosenChain,
  CardanoRosenChain,
  BitcoinRosenChain,
  RosenChains,
  RosenUserInterface,
} from "@rosen/sdk";
```

## Environment Variables

The package comes with default values for Explorer URLs.
To utilize your preferred explorer urls, you can set it in the `.env` file like this:

```
CARDANO_EXPLORER_API=https://api.koios.rest/api/v1
ERGO_EXPLORER_API=https://api.ergoplatform.com
BITCOIN_EXPLORER_API=https://api.koios.rest/api/v1
```

## Classes and Interfaces

### `IRosenUserInterface`

The `IRosenUserInterface` interface defines methods for interacting with supported chains and tokens.

#### Methods

- `getSupportedChains(): Array<string>`: Returns a list of supported chains.
- `getChainSupportedTokens(chain: string): Array<RosenChainToken>`: Gets details of all supported tokens on a chain.
- `getAvailableChainsForToken(chain: string, tokenId: string): Array<string>`: Gets a list of chains that support a specific token.
- `getTokenDetailsOnTargetChain(chain: string, tokenId: string, targetChain: string): RosenChainToken | null`: Gets details of a token on a specific target chain.
- `getMinimumTransferAmountForToken(fromChain: keyof typeof Networks, tokenId: string, toChain: keyof typeof Networks, height: number): Promise<bigint>`: Calculates the minimum allowed transfer for a token.
- `getFeeByTransferAmount(fromChain: keyof typeof Networks, tokenId: string, toChain: keyof typeof Networks, amount: bigint, recommendedNetworkFee: bigint, height: number): Promise<Fees>`: Gets the bridge and network fee by transfer amount.
- `convertFeeToAssetUnit(tokenId: string, toChain: keyof typeof Networks, height: number, baseNetworkFee: bigint): Promise<bigint>`: Converts base network fee for a chain to the given asset unit.

### `RosenUserInterface`

The `RosenUserInterface` class implements the `IRosenUserInterface` and provides methods to interact with supported chains and tokens.

#### Constructor

```typescript
constructor(
  tokens: RosenTokens,
  minimumFeeNFT: string,
  ergoNetworkType: ErgoNetworkType = ErgoNetworkType.explorer,
  config: RosenSDKConfig = DefaultRosenSDKConfig,
  logger?: AbstractLogger
)
```

to utilize this class, you can instantiate it by following these steps:

1. Retrieve the latest tokens from rosen-bridge

```bash
npx @rosen-bridge/cli download-assets --chain-type public-launch --out some/download/path
```

2. Instantiate RosenUserInterface class

```typescript
import tokens from "../rosen-public-tokens.json";
import rosenConfig from "../../rosen-config.json";
import { ErgoNetworkType } from "@rosen-bridge/minimum-fee";
import { RosenUserInterface, DefaultRosenSDKConfig } from "@rosen/sdk";

const rosenUI: RosenUserInterface = new RosenUserInterface(
  tokens,
  rosenConfig.tokens.RSNRatioNFT,
  ErgoNetworkType.explorer,
  DefaultRosenSDKConfig
);
```

#### Methods

- `getSupportedChains(): Array<string>`: Returns a list of supported chains.
- `getChainSupportedTokens(chain: string): Array<RosenChainToken>`: Gets details of all supported tokens on a chain.
- `getAvailableChainsForToken(chain: string, tokenId: string): Array<string>`: Gets a list of chains that support a specific token.
- `getTokenDetailsOnTargetChain(chain: string, tokenId: string, targetChain: string): RosenChainToken | null`: Gets details of a token on a specific target chain.
- `getMinimumTransferAmountForToken(fromChain: keyof typeof Networks, tokenId: string, toChain: keyof typeof Networks, height: number): Promise<bigint>`: Calculates the minimum allowed transfer for a token.
- `getFeeByTransferAmount(fromChain: keyof typeof Networks, tokenId: string, toChain: keyof typeof Networks, amount: bigint, recommendedNetworkFee: bigint, height: number): Promise<Fees>`: Gets the bridge and network fee by transfer amount.
- `convertFeeToAssetUnit(tokenId: string, toChain: keyof typeof Networks, height: number, baseNetworkFee: bigint): Promise<bigint>`: Converts base network fee for a chain to the given asset unit.

### `IRosenChain`

The `IRosenChain` interface defines methods for interacting with a blockchain network within the Rosen bridge.

#### Methods

- `getBaseNetworkFee(): bigint`: Returns the base network fee for the blockchain network.
- `generateUnsignedBridgeTx(
  token: RosenChainToken,
  toChain: string,
  toAddress: string,
  changeAddress: string,
  amount: bigint,
  bridgeFee: bigint,
  networkFee: bigint,
  utxoIterator: AsyncIterator<CardanoUtxo | ErgoBoxProxy, undefined> | Iterator<CardanoUtxo | ErgoBoxProxy, undefined>
): Promise<string | UnsignedErgoTxProxy>`: Generates an unsigned bridge transaction for transferring tokens to another blockchain network.

### `ErgoRosenChain`

The `ErgoRosenChain` class provides methods to interact with the Ergo blockchain within the Rosen bridge.

#### Methods

- `static getBaseNetworkFee(): bigint`: Returns the base network fee for the Ergo blockchain.
- `static async generateUnsignedBridgeTx(
  token: RosenChainToken,
  toChain: string,
  toAddress: string,
  changeAddress: string,
  amount: bigint,
  bridgeFee: bigint,
  networkFee: bigint,
  utxoIterator: AsyncIterator<CardanoUtxo | ErgoBoxProxy, undefined> | Iterator<CardanoUtxo | ErgoBoxProxy, undefined>,
  lockAddress: string = LOCK_ADDRESSES.ergo,
  logger?: AbstractLogger
): Promise<string | UnsignedErgoTxProxy>`: Generates an unsigned bridge transaction for transferring tokens to another blockchain network.

### `CardanoRosenChain`

The `CardanoRosenChain` class provides methods to interact with the Cardano blockchain within the Rosen bridge.

#### Methods

- `static getBaseNetworkFee(): bigint`: Returns the base network fee for the Cardano blockchain.
- `static async generateUnsignedBridgeTx(
  token: RosenChainToken,
  toChain: string,
  toAddress: string,
  changeAddress: string,
  amount: bigint,
  bridgeFee: bigint,
  networkFee: bigint,
  utxoIterator: AsyncIterator<CardanoUtxo | ErgoBoxProxy, undefined> | Iterator<CardanoUtxo | ErgoBoxProxy, undefined>
): Promise<string>`: Generates an unsigned bridge transaction for transferring tokens to another blockchain network.

### `BitcoinRosenChain`

The `BitcoinRosenChain` class provides methods to interact with the Bitcoin blockchain within the Rosen bridge.

#### Methods

- `static getBaseNetworkFee(): bigint`: Returns the base network fee for the Bitcoin blockchain.
- `static async generateUnsignedBridgeTx(
  token: RosenChainToken,
  toChain: string,
  toAddress: string,
  changeAddress: string,
  amount: bigint,
  bridgeFee: bigint,
  networkFee: bigint,
  utxoIterator: AsyncIterator<CardanoUtxo | ErgoBoxProxy, undefined> | Iterator<CardanoUtxo | ErgoBoxProxy, undefined>
): Promise<string>`: Generates an unsigned bridge transaction for transferring tokens to another blockchain network.

## Utilities

### `LOCK_ADDRESSES`

An object containing the lock addresses for different blockchain networks.

#### Example

```typescript
import { LOCK_ADDRESSES } from "@rosen/sdk";

console.log(LOCK_ADDRESSES.ergo); // Prints the Ergo lock address
console.log(LOCK_ADDRESSES.cardano); // Prints the Cardano lock address
console.log(LOCK_ADDRESSES.bitcoin); // Prints the Bitcoin lock address
```

### `baseTxUrl`

Returns the base transaction URL for a given blockchain network.

#### Parameters

- `chain: keyof typeof Networks`: The blockchain network.

#### Returns

- `string`: The base transaction URL.

#### Example

```typescript
import { baseTxUrl, Networks } from "@rosen/sdk";

const ergoTxUrl = baseTxUrl(Networks.ergo);
console.log(ergoTxUrl); // Prints the base transaction URL for Ergo

const cardanoTxUrl = baseTxUrl(Networks.cardano);
console.log(cardanoTxUrl); // Prints the base transaction URL for Cardano

const bitcoinTxUrl = baseTxUrl(Networks.bitcoin);
console.log(bitcoinTxUrl); // Prints the base transaction URL for Bitcoin
```

## Example Usage

### Generating an Unsigned Bridge Transaction

```typescript
import { ErgoRosenChain, RosenChainToken, LOCK_ADDRESSES } from "@rosen/sdk";

// Define the token and transaction parameters
const token: RosenChainToken = {
  id: "token-id",
  name: "Token Name",
  decimals: 2,
};
const toChain = "cardano";
const toAddress = "addr1..."; // Destination Cardano Address
const changeAddress = "958fi2"; // Current Chain (Ergo) change address
const amount = 1000000n;
const bridgeFee = 50000n;
const networkFee = 20000n;
const utxoIterator = getUtxoIterator(); // Assume this function provides the UTXO iterator

// Generate the unsigned bridge transaction
const unsignedTx = await ErgoRosenChain.generateUnsignedBridgeTx(
  token,
  toChain,
  toAddress,
  changeAddress,
  amount,
  bridgeFee,
  networkFee,
  utxoIterator,
  LOCK_ADDRESSES.ergo
);

console.log(unsignedTx); // Prints the unsigned transaction
```

## Conclusion

The RosenChain SDK provides a powerful and flexible way to interact with multiple blockchain networks and manage assets within the Rosen bridge. With a variety of utility functions and classes, developers can easily integrate blockchain functionality into their applications.

For more information and detailed API documentation, please refer to the official documentation or contact the support team.

---
