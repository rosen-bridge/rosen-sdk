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
- Chain-Specific:
  1. `getAssetNetworkFee`: returns network fee for an asset
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

  // get and init above variables in constructor
  constructor (
    tokens: RosenTokens,
    minimumFeeNFT: string,
    minimumFeeAddress: string
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
- Get minimum bridge fee, network fee and fee ratio for the token using `@rosen-bridge/minimum-fee` package
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
- Get minimum bridge fee, network fee and fee ratio for the token using `@rosen-bridge/minimum-fee` package
- Calculate bridge fee:

  - $mbf$: minimum bridge fee
  - $fr$: fee ratio
  - $frd$: fee ratio divisor
    $$
    bf = max(mbf, fr * amount / frd)
    $$

- Calculate network fee:
  - $mnf$: minimum network fee
    $$
    nf = max(mnf, recommendedNetworkFee)
    $$

```ts
/**
 * gets list of chains that supports a token
 * @param fromChain
 * @param height blockchain height of fromChain
 * @param tokenId token id on fromChain
 * @param toChain
 * @param amount transfer amount
 * @param recommendedNetworkFee the current network fee on toChain (it is highly recommended to fetch this value from `getAssetNetworkFee` function of toChain)
 * @returns the bridge and network fee
 */
public getFeeByTransferAmount: (fromChain: string, height: number, tokenId: string, toChain: string, amount: bigint, recommendedNetworkFee: bigint): { bridgeFee: bigint, networkFee: bigint };
```

### Chain-Specific

The chain-specific functions are explained in a separate document for each chain alongside other requirements for that chain.

#### Ergo

_TBD. link to Ergo document_

#### Cardano

_TBD. link to Cardano document_

#### Bitcoin

_TBD. link to Bitcoin document_
