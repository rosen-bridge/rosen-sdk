# Rosen SDK: Bitcoin

This document describes the chain-specific functions of Rosen SDK for the Bitcoin chain.

## Contents

- [Transaction Structure](#transaction-structure)
- [Implementation Details](#implementation-details)
  - [generateLockTransaction](#generatelocktransaction)

## Transaction Structure

The lock transaction on Bitcoin bridges only BTC (the native token). The transaction should contain the following main components:

1. **OP_RETURN Metadata**: Rosen data for the transfer is written in an OP_RETURN output. The data is a hex-encoded string, not JSON, and is constructed as follows:

   - `toChainHex` (2 hex chars): Index of the target chain, left-padded to 2 hex digits
   - `bridgeFeeHex` (16 hex chars): Bridge fee, left-padded to 16 hex digits
   - `networkFeeHex` (16 hex chars): Network fee, left-padded to 16 hex digits
   - `addressLengthCode` (2 hex chars): Length of the destination address in bytes, left-padded to 2 hex digits
   - `addressHex`: The hex-encoded destination address

   The final OP_RETURN data is the concatenation of these fields, e.g.:

   ```
   <toChainHex><bridgeFeeHex><networkFeeHex><addressLengthCode><addressHex>
   ```

   **Example:**

   - toChain: 1 (hex: "01")
   - bridgeFee: 10000 (hex: "0000000000002710")
   - networkFee: 5000 (hex: "0000000000001388")
   - addressHex: "abcdef..." (length: 20 bytes, hex: "14")
   - Result: `010000000000002710000000000000138814abcdef...`

   > **Note:** The OP_RETURN data is not JSON and does not include fromAddress or field names. It is a compact, concatenated hex string.

2. **Locked Assets**: Only BTC is supported. The transfer amount must be sent to the lock address in a single UTxO.

## Implementation Details

### `generateLockTransactionCore`

This function generates an unsigned lock transaction on Bitcoin. Only BTC is supported as the asset to bridge.

The function should use only a portion of UTxOs that covers the required BTC. It may need to fetch UTxOs page by page. To this purpose, an Iterator object of the UTxOs is passed to the function. UTxOs are in `BitcoinUtxo` format, which is:

```ts
export interface BitcoinUtxo {
  txId: string;
  index: number;
  address: string;
  value: bigint; // in satoshis
}
```

The function should create a transaction with:

- An OP_RETURN output with the Rosen metadata (see above)
- An output to the lock address with the transfer amount (BTC only)
- Change output(s) as needed

A simplified function signature:
The `feeRatio` is required as a `networkParams` to calculate required fee for lock transaction. The interface is:

```ts
/**
 * generates an unsigned lock transaction on Bitcoin
 * @param tokenId only btc (native token) is supported
 * @param toChain
 * @param toEncodedAddress encoded address of the recipient on the target chain (to encoded destination address, you can use `encodeAddress` function of package @rosen-bridge/address-codec)
 * @param fromAddress
 * @param unwrappedAmount
 * @param wrappedBridgeFee
 * @param wrappedNetworkFee
 * @param utxoIterator
 * @param networkParams
 * @return UnsignedPsbtData
 */
protected generateLockTransactionCore = async (
        tokenId: string,
        toChain: NETWORKS,
        toEncodedAddress: string,
        fromAddress: string,
        unwrappedAmount: bigint,
        wrappedBridgeFee: bigint,
        wrappedNetworkFee: bigint,
        utxoIterator:
                | AsyncIterator<BitcoinUtxo, undefined>
                | Iterator<BitcoinUtxo, undefined>,
        networkParams: NetworkParams,
): Promise<UnsignedPsbtData>
```
