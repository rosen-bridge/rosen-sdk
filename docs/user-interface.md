# Rosen SDK Documentation

This document states the required functionality in Rosen SDK alongside the suggested structure and implementation details of it.

## Contents

- [Required Functionality](#required-functionality)
- [Suggested Structure](#suggested-structure)
- [Implementation Details](#implementation-details)
  - [Common](#common)
    - [RosenUserInterface](#rosenuserinterface)
    - [getSupportedChains](#getsupportedchains)
    - [getChainSupportedTokens](#getchainsupportedtokens)
    - [getAvailableChainsForToken](#getavailablechainsfortoken)
    - [getTokenDetailsOnTargetChain](#gettokendetailsontargetchain)
    - [getMinimumTransferAmountForToken](#getminimumtransferamountfortoken)
    - [getFeeByTransferAmount](#getfeebytransferamount)
    - [convertFeeToAssetUnit](#convertfeetoassetunit)
  - [Chain-Specific](#chain-specific)
    - [Ergo](#ergo)
    - [Cardano](#cardano)
    - [Bitcoin](#bitcoin)

## Required Functionality

- Common:
  1. `getSupportedChains`: returns list of supported chains
  2. `getChainSupportedTokens`: returns the list of supported tokens for a chain
  3. `getAvailableChainsForToken`: returns the list of chains that support an asset
  4. `getTokenDetailsOnTargetChain`: returns details of an asset on the given chain (such as name, decimals, id, ...)
  5. `getMinimumTransferAmountForToken`: returns the minimum allowed transfer for an asset
  6. `getFeeByTransferAmount`: returns bridge fee and network fee for a transfer request
  7. `convertFeeToAssetUnit`: converts fee for a chain to the asset unit
- Chain-Specific:
  1`generateLockTransaction`: returns an unsigned transaction for a transfer request

## Suggested Structure

We suggest a mono-repo structure for more organized and easier maintenance. The repo contains a package for each supported chain that implements the required chain-specific functions.

There is a core package that implements common functions. It also re-exports the chain-specific packages.

As almost all of the common functions need the list of supported tokens which is available in the `tokens.json` file, implementing common functions in a class facilitates interacting with them.

## Implementation Details

### Common

#### `RosenUserInterface`

Implementing a base class that contains the common functions. It gets the required parameters on initialization, such as the list of supported tokens.

```ts
export class RosenUserInterface {
  tokenMap: TokenMap;
  minimumFeeNFT: string;
  minimumFeeAddress: string;
  // these two variables are used to generate Ergo client in order to fetch minimum-fee boxes from the blockchain
  ergoNetworkType: ErgoNetworkType; // available in @rosen-bridge/minimum-fee
  networkUrl: string;

  // get and init above variables in constructor
  constructor (
    tokenMap: TokenMap,
    minimumFeeNFT: string,
    minimumFeeAddress: string,
    ergoNetworkType: ErgoNetworkType,
    networkUrl: string,
    logger?: AbstractLogger
  ) {
    ...
  }

  // common functions
  ...
}
```

#### `getSupportedChains`

The list of supported chains can be hard-coded or fetched from the token map. Hard-coded seems more reasonable since the chain-specific functions are also re-exported in the package.

```ts
/**
 * @returns list of supported chains
 */
public getSupportedChains = (): Array<string> => SUPPORTED_CHAINS;
```

#### `getChainSupportedTokens`

- Search the token in the token map
- Return the expected field (the given chain) for each element of the result

```ts
/**
 * gets details of all supported tokens on a chain
 * @param chain
 * @returns the list of supported tokens
 */
public getChainSupportedTokens = (chain: NETWORKS): Array<RosenChainToken> => {
  return this.tokenMap
    .search(chain, {})
    .map(obj => obj[chain])
}
```

#### `getAvailableChainsForToken`

- Search the token in the token map
  - If an empty list is returned, throw an error
- Get the first element of the list and return its keys

```ts
/**
 * gets list of chains that supports a token
 * @param chain
 * @param tokenId token id on the given chain
 * @returns the list of chains that support
 */
public getAvailableChainsForToken: (chain: NETWORKS, tokenId: string): Array<string>;
```

#### `getTokenDetailsOnTargetChain`

- Search the token in the token map
  - If an empty list is returned, throw an error
- Get the first element of the list
  - If the target chain is not on the list of its keys, throw an error
- Return value under the target chain key

```ts
/**
 * gets details of a token on a chain
 * @param fromChain
 * @param tokenId Token id on the fromChain
 * @param toChain
 * @returns the token details
 */
public getTokenDetailsOnTargetChain = (fromChain: NETWORKS, tokenId: string, toChain: NETWORKS): RosenChainToken
```

#### `getMinimumTransferAmountForToken`

- Search the token in the token map
  - If an empty list is returned, throw an error
- Get the first element of the list
  - If the target chain is not on the list of its keys, throw an error
- Get the corresponding token ID on the Ergo network using this object and the `getID` function of the token map
- Get the minimum bridge fee, network fee and fee ratio for the token using the `@rosen-bridge/minimum-fee` package
- Calculate minimum transfer using this formula:

  - $mt$: minimum transfer
  - $mnf$: minimum network fee
  - $mbf$: minimum bridge fee
  - $p$: fee ratio

  $$
  mt = max(mnf + mbf + 1, (mnf + 1) / (1-p))
  $$

```ts
/**
 * calculates the minimum allowed transfer for a token based
 * on bridging chains, minimum bridge fee and network fee on a specific height
 * @param fromChain
 * @param tokenId token id on fromChain
 * @param height blockchain height of fromChain
 * @param toChain
 * @returns the minimum allowed transfer
 */
public getMinimumTransferAmountForToken = async (fromChain: NETWORKS, tokenId: string, height: number, toChain: NETWORKS): Promise<bigint>
```

#### `getFeeByTransferAmount`

- Search the token in the token map
  - If an empty list is returned, throw an error
- Get the first element of the list
  - If the target chain is not on the list of its keys, throw an error
- Get the corresponding token ID on the Ergo network using this object and the `getID` function of the token map
- Get the minimum bridge fee, network fee and fee ratio for the token using the `@rosen-bridge/minimum-fee` package
- Convert network fee to the asset unit using the `convertFeeToAssetUnit` function
- Calculate bridge fee:

  - $mbf$: minimum bridge fee
  - $fr$: fee ratio
  - $frd$: fee ratio divisor
    $$
    bf = max(mbf, fr * amount / frd)
    $$

```ts
  /**
 * calculates the bridge fee and network fee for a token transfer
 * @param fromChain
 * @param tokenId token id on fromChain
 * @param height blockchain height of fromChain
 * @param toChain
 * @param actualAmount transfer amount
 * @returns the bridge and network fee
 */
public getFeeByTransferAmount = async (fromChain: NETWORKS, tokenId: string, height: number, toChain: NETWORKS, actualAmount: bigint): Promise<RosenFees>
```

#### `convertFeeToAssetUnit`

- Search the token in the token map
  - If an empty list is returned, throw an error
- Get the first element of the list
  - If the target chain is not on the list of its keys, throw an error
- Get the corresponding token ID on the Ergo network using this object and the `getID` function of the token map
- Search the native token of the target chain in the token map
- Get the first element of the list
- Get the corresponding token ID on the Ergo network using this object and the `getID` function of the token map
- Get the RSN ratio for the token and the native token using the `@rosen-bridge/minimum-fee` package
- Convert fee to the token unit:
  - $nr$: native-token (ADA) RSN ratio
  - $nrdiv$: native-token (ADA) RSN ratio divisor
  - $ar$: the asset RSN ratio
  - $ardiv$: the asset RSN ratio divisor
    $$
    nf = (fee * nr * ardiv) / (ar * nrdiv)
    $$

```ts
  /**
 * converts fee for a chain to the given asset unit
 * @param fromChain
 * @param tokenId Token id on the fromChain
 * @param height blockchain height of fromChain
 * @param toChain
 * @param fee fee in toChain native token unit
 * @returns the fee in asset unit
 */
public convertFeeToAssetUnit = async (fromChain: NETWORKS, tokenId: string, height: number, toChain: NETWORKS, fee: bigint): Promise<bigint>
```

### Chain-Specific

The chain-specific functions are explained in a separate document for each chain alongside other requirements for that chain.

#### Ergo

[**Ergo Specification**](./sdk-ergo.md)

#### Cardano

[**Cardano Specification**](./sdk-cardano.md)

#### Bitcoin

_TBD. link to Bitcoin document_
