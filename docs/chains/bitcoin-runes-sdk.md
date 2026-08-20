# Rosen SDK: Bitcoin Runes

This document describes the chain-specific functions of Rosen SDK for the Bitcoin Runes chain.

## Contents

- [Transaction Structure](#transaction-structure)
- [Implementation Details](#implementation-details)
  - [generateLockTransactionCore](#generatelocktransactioncore)

## Transaction Structure

The lock transaction on Bitcoin Runes bridges only runes. BTC (the native token) is not a bridgeable asset and is only used to fund the outputs and the transaction fee.

Since a runestone already occupies the single OP_RETURN output that a transaction may carry, the Rosen data cannot be written in an OP_RETURN as it is on Bitcoin. It is instead split into chunks, each embedded in the script of a separate output.

The outputs are ordered as follows:

| Index    | Output    | Value (satoshi)         |
| -------- | --------- | ----------------------- |
| 0        | change    | remainder of the inputs |
| 1        | runestone | 0                       |
| 2        | lock      | 294                     |
| 3 .. n+2 | lock data | 294, 295, 296, ...      |

1. **Change**: Holds the leftover satoshi and, through the runestone pointer, the leftover runes. It is sent back to `fromAddress`.

2. **Runestone**: An OP_RETURN output carrying the runes transfer. It contains a single edict that assigns the transfer amount of the rune to output `2` (the lock output), and a `pointer` of `0`, which sends every leftover rune of the inputs to the change output.

3. **Locked Assets**: Only runes are supported. The transfer amount is assigned to the lock output by the runestone edict, so the output itself only needs to hold the dust limit of 294 satoshi.

4. **Lock Data**: Rosen data for the transfer is a hex-encoded string, not JSON, and is constructed as follows:

   - `toChainHex` (2 hex chars): Index of the target chain, left-padded to 2 hex digits
   - `bridgeFeeHex` (16 hex chars): Bridge fee, left-padded to 16 hex digits
   - `networkFeeHex` (16 hex chars): Network fee, left-padded to 16 hex digits
   - `addressLengthCode` (2 hex chars): Length of the destination address in bytes, left-padded to 2 hex digits
   - `addressHex`: The hex-encoded destination address

   The final data is the concatenation of these fields:

   ```
   <toChainHex><bridgeFeeHex><networkFeeHex><addressLengthCode><addressHex>
   ```

   **Example:**

   - toChain: 1 (hex: "01")
   - bridgeFee: 10000 (hex: "0000000000002710")
   - networkFee: 5000 (hex: "0000000000001388")
   - addressHex: "abcdef..." (length: 20 bytes, hex: "14")
   - Result: `010000000000002710000000000000138814abcdef...`

   This string is split into chunks of 40 hex chars (20 bytes), and each chunk is written into the script of its own output, prefixed with `0014` so that the output takes the shape of a native segwit one. The last chunk is right-padded with zeros to 40 hex chars:

   ```
   0014<chunk>
   ```

   The chunks are ordered, and the order is preserved by the value of the outputs: the first data output holds 294 satoshi (the dust limit of a native segwit output) and every following one holds 1 satoshi more than the previous, so the reader can restore the original order regardless of how the outputs are indexed.

   > **Note:** The lock data is not JSON and does not include fromAddress or field names. It is a compact, concatenated hex string, identical to the OP_RETURN payload of the other UTxO chains.

## Implementation Details

### `generateLockTransactionCore`

This function generates an unsigned lock transaction on Bitcoin Runes. Only runes are supported as the asset to bridge; passing the native token id throws `UnsupportedTokenException`.

The function should use only a portion of UTxOs that covers the required rune amount and satoshi. It may need to fetch UTxOs page by page. To this purpose, an Iterator object of the UTxOs is passed to the function. UTxOs are in `BitcoinRunesUtxo` format, which is:

```ts
export interface BitcoinRunesUtxo {
  txId: string;
  index: number;
  value: bigint; // in satoshis
  runes: Array<{ runeId: string; quantity: bigint }>;
  address?: string;
}
```

Every UTxO is validated as it is pulled from the iterator, and one whose address is missing or is neither native segwit nor taproot causes an `InvalidUtxoException`.

The required satoshi is not a parameter of the transfer, it is derived from the number of lock data chunks:

```
required = 294 + (294 * chunksCount + ceil(chunksCount * (chunksCount - 1) / 2))
```

which is the dust limit of the lock output plus the value of all the data outputs.

Addresses are restricted to native segwit (`bc1q...`) and taproot (`bc1p...`). Since a taproot input has to declare the internal public key of its address, the caller passes them through `networkParams`. The `feeRatio` is required as well, to calculate the fee of the lock transaction. The interface is:

```ts
export type NetworkParams = {
  feeRatio: number;
  taprootScriptInfo: Map<string, string>; // address -> internalPubkey
};
```

A taproot address that is selected as an input but is missing from `taprootScriptInfo` causes an `InvalidTaprootInfoException`.

The fee is estimated from the virtual size of the assumed transaction, counting the weight units of the inputs by their type, the outputs that are known in advance (the lock output and the data outputs), the change outputs and the runestone script.

A simplified function signature:

```ts
/**
 * generates an unsigned lock transaction on Bitcoin Runes
 * @param tokenId rune id of the token to bridge, btc (native token) is not supported
 * @param toChain
 * @param toEncodedAddress encoded address of the recipient on the target chain (to encoded destination address, you can use `encodeAddress` function of package @rosen-bridge/address-codec)
 * @param fromAddress native segwit or taproot address of the sender
 * @param unwrappedAmount
 * @param wrappedBridgeFee
 * @param wrappedNetworkFee
 * @param utxoIterator
 * @param networkParams
 * @returns UnsignedPsbtData
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
                | AsyncIterator<BitcoinRunesUtxo, undefined>
                | Iterator<BitcoinRunesUtxo, undefined>,
        networkParams: NetworkParams,
): Promise<UnsignedPsbtData>
```

The returned value carries the unsigned PSBT and the inputs each address has to sign, since the inputs may be spent from more than one address:

```ts
export interface UnsignedPsbtData {
  psbt: string; // base64 encoded PSBT
  psbtHex: string; // hex encoded PSBT
  signInputs: Record<string, number[]>; // address -> indexes of the inputs spent from it
}
```
