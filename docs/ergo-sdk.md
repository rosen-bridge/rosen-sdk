# Rosen SDK: Ergo

This document states the chain-specific functions of Rosen SDK on the Ergo chain.

## Contents

- [Transaction Structure](#transaction-structure)
- [Implmentation Details](#implmentation-details)
  - [getBaseNetworkFee](#getbasenetworkfee)
  - [generateLockAuxiliaryData](#generatelockauxiliarydata)
  - [generateLockTransaction](#generatelocktransaction)

## Transaction Structure

The lock transaction on Ergo contains a UTxO to the lock address (aka the lock box) with a valid R4 in the `coll coll byte` format. The values by order are:

- `toChain`: _string_, the target blockchain
- `toAddress`: _string_, the destination address in the target blockchain
- `networkFee`: _string_, the amount of network fee for this transfer
- `bridgeFee`: _string_, the amount of bridge fee for this transfer
- `fromAddress`: _string_, the address that is requesting the transfer

For example, in ([this transaction](https://explorer.ergoplatform.com/en/transactions/193e1dc2d7340d991ade1af51467a1caac097ad8e940edf66105f28421af0817)), the first output box is the lock address. It contains R4 with serialized value:

> 1a050763617264616e6f67616464723171797a653772637332396164326332796d79346d773530673875766e67643038387673786530766b386e76717739337a6d613576386c6671796a67376833363872707177356a6b386e336e636a356832743467306e6e6c6167676e7164307335736c053234313530083530303030303030333965596837455079445468524a46714d5975525436727a7a643468377074445a53335a4a684b4e4732726d4b72656556624733

which renders to:

- `63617264616e6f`
- `616464723171797a653772637332396164326332796d79346d773530673875766e67643038387673786530766b386e76717739337a6d613576386c6671796a67376833363872707177356a6b386e336e636a356832743467306e6e6c6167676e7164307335736c`
- `3234313530`
- `3530303030303030`
- `3965596837455079445468524a46714d5975525436727a7a643468377074445a53335a4a684b4e4732726d4b72656556624733`

which represents:

- `toChain`: cardano
- `toAddress`: addr1qyze7rcs29ad2c2ymy4mw50g8uvngd088vsxe0vk8nvqw93zma5v8lfqyjg7h368rpqw5jk8n3ncj5h2t4g0nnlaggnqd0s5sl
- `networkFee`: 24150
- `bridgeFee`: 50000000
- `fromAddress`: 9eYh7EPyDThRJFqMYuRT6rzzd4h7ptDZS3ZJhKNG2rmKreeVbG3

If the lock box contains a token that is supported in the target chain, the transaction is recognized as a token transfer, otherwise it is recognized as an ERG transfer. Note that if extracting data from R4 fails or the transferring asset is not supported on the target chain, the lock transaction is not valid and is considered a donation.

## Implmentation Details

Alongside two chain-specific functions of Rosen SDK, another function is also suggested for Ergo. The implementation details of each one are described here.

### `getBaseNetworkFee`

The network fee on Ergo is fixed and 0.0013 ERG. Therefore this function returns 1300000 (nano-Erg unit).

```ts
/**
 * calculates the network fee on Ergo in nano-Erg unit
 * @returns the base network fee
 */
export const getBaseNetworkFee = (): bigint => 1300000n;
```

### `createLockBox`

This function creates the lock box with the format specified in the [Transaction Structure section](#transaction-structure). A version of this function is available at [`@rosen-bridge/ui` GitHub](https://github.com/rosen-bridge/ui/blob/1c0b08f5407e929f5680aa01a316e2dc88ef1408/apps/rosen/app/_networks/ergo/transaction/utils.ts#L32).

```ts
/**
 * creates lock box candidate
 * @param lockAddress
 * @param height
 * @param tokenId
 * @param amount
 * @param toChain
 * @param toAddress
 * @param fromAddress
 * @param bridgeFee
 * @param networkFee
 */
export const createLockBox: (
  lockAddress: string,
  height: number,
  tokenId: string,
  amount: bigint,
  toChain: string,
  toAddress: string,
  fromAddress: string,
  bridgeFee: bigint,
  networkFee: bigint
) => ErgoBoxCandidate;
```

### `generateLockTransaction`

This function generates an unsigned lock transaction.

The function should use only a portion of UTxOs that covers the required assets. It may need to fetch UTxOs page by page. To this purpose, an Iterator object of the UTxOs is passed to the function. UTxOs are in `ErgoBoxProxy` format, which is based on EIP-12. It also returns the unsigned transaction in EIP-12 format (which is available via the `to_js_eip12` function of `ergo-lib-wasm` with some minor modifications).

A simple version of this function is available at [`@rosen-bridge/ui` GitHub](https://github.com/rosen-bridge/ui/blob/1c0b08f5407e929f5680aa01a316e2dc88ef1408/apps/rosen/app/_networks/ergo/transaction/generateTx.ts#L32).

```ts
/**
 * generates an unsigned lock transaction on Ergo
 * @param changeAddress
 * @param utxoIterator
 * @param lockAddress
 * @param toChain
 * @param toAddress
 * @param tokenId
 * @param amount
 * @param bridgeFee
 * @param networkFee
 * @returns
 */
export const generateUnsignedTx = async (
  changeAddress: string,
  utxoIterator:
    | AsyncIterator<ErgoBoxProxy, undefined>
    | Iterator<ErgoBoxProxy, undefined>,
  lockAddress: string,
  toChain: string,
  toAddress: string,
  tokenId: string,
  amount: bigint,
  bridgeFee: bigint,
  networkFee: bigint,
): Promise<UnsignedErgoTxProxy>
```
