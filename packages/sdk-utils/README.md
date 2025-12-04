# @rosen-bridge/sdk-utils

## Table of contents

- [@rosen-bridge/sdk-utils](#rosen-bridgesdk-utils)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Generate Rosen Data](#generate-rosen-data)

## Introduction

This project includes utils functions that clients or chain sdks require to interact with.

## Installation

npm:

```sh
npm i @rosen-bridge/sdk-utils
```

yarn:

```sh
yarn add @rosen-bridge/sdk-utils
```

## Usage

### Generate Rosen Data

```typescript
import { encodeAddress } from '@rosen-bridge/address-codec';
import { NETWORKS } from '@rosen-bridge/sdk-constant';

const toChain = NETWORKS.EXAMPLE_CHAIN;
const toEncodedAddress = encodeAddress(toChain, toExampleChainAddress);
const hex = generateRosenData(toChain, toEncodedAddress, 153n, 9551n);

console.log(hex);
```
