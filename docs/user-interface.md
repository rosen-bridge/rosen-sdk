# Rosen SDK Documantation

This document states the required functionality in Rosen SDK alongside the suggested structure and implementation details of it.

## Contents

- [Required Functionality](#required-functionality)
- [Suggested Structure](#suggested-structure)
- [Implmentation Details](#implmentation-details)
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
  7. `convertFeeToAssetUnit`: converts base network fee for a chain to the asset unit
- Chain-Specific:
  1. `getBaseNetworkFee`: returns network fee in native-token unit
  2. `generateLockTransaction`: returns an unsigned transaction for a transfer request

## Suggested Structure

We suggest a mono-repo structure for more organized and easier maintenance. The repo contains a package for each supported chain that implements the required chain-specific functions.

There is a core package that implements common functions. It also re-exports the chain-specific packages.

As almost all of the common functions need the list of supported tokens which is available in the `tokens.json` file, implementing common functions in a class facilitates interacting with them.

## Implmentation Details

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
    tokens: RosenTokens,
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
public getChainSupportedTokens = (chain: string): Array<RosenChainToken> => {
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
public getAvailableChainsForToken: (chain: string, tokenId: string): Array<string>;
```

#### `getTokenDetailsOnTargetChain`

- Search the token in the token map
  - If an empty list is returned, throw an error
- Get the first element of the list
  - If the target chain is not on the list of its keys, throw an error
- Return value under the target chain key

```ts
/**
 * gets details of an token on a chain
 * @param chain
 * @param tokenId token id on the given chain
 * @param targetChain
 * @returns the token details
 */
public getTokenDetailsOnTargetChain: (chain: string, tokenId: string, targetChain: string): RosenChainToken;
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
  mt = max(mnf + mbf, mnf / (1-p))
  $$

```ts
/**
 * calculates the minimum allowed transfer for a token based
 * on minimum bridge fee and network fee on a specific height
 * @param fromChain
 * @param height blockchain height of fromChain
 * @param tokenId token id on fromChain
 * @param toChain
 * @returns the minimum allowed transfer
 */
public getMinimumTransferAmountForToken: (fromChain: string, height: number, tokenId: string, toChain: string) => bigint;
```

#### `getFeeByTransferAmount`

- Search the token in the token map
  - If an empty list is returned, throw an error
- Get the first element of the list
  - If the target chain is not on the list of its keys, throw an error
- Get the corresponding token ID on the Ergo network using this object and the `getID` function of the token map
- Get the minimum bridge fee, network fee and fee ratio for the token using the `@rosen-bridge/minimum-fee` package
- Convert recommendedNetworkFee to the asset unit using the `convertFeeToAssetUnit` function
- Calculate bridge fee:

  - $mbf$: minimum bridge fee
  - $fr$: fee ratio
  - $frd$: fee ratio divisor
    $$
    bf = max(mbf, fr * amount / frd)
    $$

- Calculate network fee:
  - $mnf$: minimum network fee
  - $rnfau$: recommended network fee in asset unit
    $$
    nf = max(mnf, rnfau)
    $$

```ts
/**
 * calculates the bridge fee and network fee for a token transfer
 * @param fromChain
 * @param height blockchain height of fromChain
 * @param tokenId token id on fromChain
 * @param toChain
 * @param amount transfer amount
 * @param recommendedNetworkFee the current network fee on toChain (it is highly recommended to fetch this value from `getBaseNetworkFee` function of toChain)
 * @returns the bridge and network fee
 */
public getFeeByTransferAmount: (fromChain: string, height: number, tokenId: string, toChain: string, amount: bigint, recommendedNetworkFee: bigint): { bridgeFee: bigint, networkFee: bigint };
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
- Convert base network fee to the token unit:
  - $nr$: native-token (ADA) RSN ratio
  - $nrdiv$: native-token (ADA) RSN ratio divisor
  - $ndec$: native-token (ADA) decimals
  - $ar$: the asset RSN ratio
  - $ardiv$: the asset RSN ratio divisor
  - $adec$: the asset decimals
    $$
    nf = (baseNetworkFee * 10^{adec} * nr * ardiv) / (ar * 10^{ndec} * nrdiv)
    $$

```ts
/**
 * converts base network fee for a chain to the given asset unit
 * @param tokenId
 * @param toChain
 * @param height blockchain height of toChain
 * @param baseNetworkFee base network fee in toChain native token unit
 * @returns the network fee in asset unit
 */
public convertFeeToAssetUnit: (tokenId: string, toChain: string, fromChain: string, height: number, baseNetworkFee: bigint) => bigint;
```

### Chain-Specific

The chain-specific functions are explained in a separate document for each chain alongside other requirements for that chain.

#### Ergo

[**Ergo Specification**](./sdk-ergo.md)

#### Cardano

[**Cardano Specification**](./sdk-cardano.md)

#### Bitcoin

_TBD. link to Bitcoin document_
