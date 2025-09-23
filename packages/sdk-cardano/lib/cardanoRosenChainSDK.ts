import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { TokenMap } from '@rosen-bridge/tokens';
import {
  AbstractRosenChainSDK,
  InsufficientAssetsException,
} from '@rosen-bridge/sdk-abstract';
import * as wasm from '@emurgo/cardano-serialization-lib-nodejs';
import { ESTIMATED_MAX_FEE, ESTIMATED_MIN_BOX_VALUE } from './constants';
import { NATIVE_TOKEN_IDS, NETWORKS } from '@rosen-bridge/sdk-constant';
import { CardanoProtocolParams, NetworkParams } from './types';
import {
  CardanoAsset,
  CardanoBoxSelection,
  AssetBalance,
  CardanoUtxo,
} from '@rosen-bridge/cardano-utxo-selection';

class CardanoRosenChainSDK extends AbstractRosenChainSDK<
  string,
  CardanoUtxo,
  NetworkParams
> {
  CHAIN = NETWORKS.CARDANO;

  constructor(
    protected tokenMap: TokenMap,
    lockAddress: string,
    protected estimatedMaxFee: bigint = ESTIMATED_MAX_FEE,
    protected estimatedMinBoxValue: bigint = ESTIMATED_MIN_BOX_VALUE,
    protected logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  /**
   * generates an unsigned lock transaction on Cardano
   * @param tokenId
   * @param toChain
   * @param toAddress
   * @param fromAddress in bech32 format
   * @param unwrappedAmount
   * @param wrappedBridgeFee
   * @param wrappedNetworkFee
   * @param utxoIterator
   * @param networkParams
   * @return UnsignedGenerateTxProxy
   */
  protected generateLockTransactionCore = async (
    tokenId: string,
    toChain: NETWORKS,
    toAddress: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    wrappedBridgeFee: bigint,
    wrappedNetworkFee: bigint,
    utxoIterator:
      | AsyncIterator<CardanoUtxo, undefined>
      | Iterator<CardanoUtxo, undefined>,
    networkParams: NetworkParams,
  ): Promise<string> => {
    const lockAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };

    if (tokenId === NATIVE_TOKEN_IDS.cardano) {
      lockAssets.nativeToken = unwrappedAmount;
    } else {
      lockAssets.tokens.push({
        id: tokenId,
        value: unwrappedAmount,
      });
    }
    const lockBox = this.createOutputBox(
      lockAssets,
      this.lockAddress,
      networkParams.protocolParams.coins_per_utxo_size,
    );

    lockAssets.nativeToken = BigInt(lockBox.amount().coin().to_str());
    const requiredAssets: AssetBalance = structuredClone(lockAssets);

    // since we are using `add_change_if_needed` two change boxes will be generated,
    // while box selection considers one of them in addition to the fee,
    // we have to include the other one in the required assets
    requiredAssets.nativeToken += this.estimatedMinBoxValue;

    const selector = new CardanoBoxSelection(this.logger);
    const selectedBoxes = await selector.getCoveringBoxes(
      requiredAssets,
      [],
      new Map(),
      utxoIterator,
      this.estimatedMinBoxValue,
      undefined,
      () => this.estimatedMaxFee,
    );
    if (!selectedBoxes.covered) {
      throw new InsufficientAssetsException(selectedBoxes.uncoveredAssets);
    }
    const auxiliaryDataHex = this.generateLockAuxiliaryData(
      toChain,
      toAddress,
      fromAddress,
      wrappedNetworkFee,
      wrappedBridgeFee,
    );
    const auxiliaryData = wasm.AuxiliaryData.from_hex(auxiliaryDataHex);
    const txBuilder = wasm.TransactionBuilder.new(
      this.getTxBuilderConfig(networkParams.protocolParams),
    );
    txBuilder.add_output(lockBox);

    const txInputs = wasm.TxInputsBuilder.new();
    selectedBoxes.boxes.forEach((utxo) => {
      const inputMultiAsset = wasm.MultiAsset.new();
      utxo.assets.forEach((token) => {
        inputMultiAsset.set_asset(
          wasm.ScriptHash.from_hex(token.policyId),
          wasm.AssetName.new(Buffer.from(token.assetName, 'hex')),
          wasm.BigNum.from_str(token.quantity.toString()),
        );
      });
      const inputValue = wasm.Value.new(
        wasm.BigNum.from_str(utxo.value.toString()),
      );

      inputValue.set_multiasset(inputMultiAsset);
      txInputs.add_regular_utxo(
        wasm.TransactionUnspentOutput.new(
          wasm.TransactionInput.new(
            wasm.TransactionHash.from_hex(utxo.txId),
            utxo.index,
          ),
          wasm.TransactionOutput.new(
            wasm.Address.from_bech32(utxo.address ? utxo.address : fromAddress),
            inputValue,
          ),
        ),
      );
    });
    txBuilder.set_inputs(txInputs);
    txBuilder.set_auxiliary_data(auxiliaryData);
    const wasmFromAddress = wasm.Address.from_bech32(fromAddress);
    txBuilder.add_change_if_needed(wasmFromAddress);
    const txBody = txBuilder.build();

    const witnessSet = wasm.TransactionWitnessSet.new();
    const tx = wasm.Transaction.new(txBody, witnessSet, auxiliaryData);
    return tx.to_hex();
  };

  /**
   * generates cardano box in TransactionOutput type
   * @param balance THIS IS AN UNWRAPPED-VALUE
   * @param address
   * @param coinsPerUtxoByte
   * @returns
   */
  createOutputBox = (
    balance: AssetBalance,
    address: string,
    coinsPerUtxoByte: string,
  ): wasm.TransactionOutput => {
    const outputBoxBuilder = wasm.TransactionOutputBuilder.new()
      .with_address(wasm.Address.from_bech32(address))
      .next();

    const multiAsset = wasm.MultiAsset.new();
    balance.tokens.forEach((token) => {
      const assetUnit = token.id.split('.');
      const policyId = wasm.ScriptHash.from_hex(assetUnit[0]);
      const assetName = wasm.AssetName.new(Buffer.from(assetUnit[1], 'hex'));
      multiAsset.set_asset(
        policyId,
        assetName,
        wasm.BigNum.from_str(token.value.toString()),
      );
    });

    return balance.nativeToken
      ? outputBoxBuilder
          .with_value(
            wasm.Value.new_with_assets(
              wasm.BigNum.from_str(balance.nativeToken.toString()),
              multiAsset,
            ),
          )
          .build()
      : outputBoxBuilder
          .with_asset_and_min_required_coin_by_utxo_cost(
            multiAsset,
            wasm.DataCost.new_coins_per_byte(
              wasm.BigNum.from_str(coinsPerUtxoByte),
            ),
          )
          .build();
  };

  /**
   * generates metadata for lock transaction
   * @param toChain
   * @param toAddress
   * @param fromAddress
   * @param networkFee
   * @param bridgeFee
   * @returns string
   */
  generateLockAuxiliaryData = (
    toChain: NETWORKS,
    toAddress: string,
    fromAddress: string,
    networkFee: bigint,
    bridgeFee: bigint,
  ): string => {
    const metadataJson = {
      to: toChain,
      bridgeFee: bridgeFee.toString(),
      networkFee: networkFee.toString(),
      toAddress,
    };
    const map = wasm.MetadataMap.new();
    for (const key in metadataJson) {
      map.insert(
        wasm.TransactionMetadatum.new_text(key),
        wasm.TransactionMetadatum.new_text(
          metadataJson[key as keyof typeof metadataJson],
        ),
      );
    }

    const fromAddressList = wasm.MetadataList.new();
    let i = 0;
    while (i < fromAddress.length) {
      fromAddressList.add(
        wasm.TransactionMetadatum.new_text(fromAddress.substring(i, i + 64)),
      );
      i += 64;
    }

    map.insert(
      wasm.TransactionMetadatum.new_text('fromAddress'),
      wasm.TransactionMetadatum.new_list(fromAddressList),
    );
    const generalTxMetadata = wasm.GeneralTransactionMetadata.new();
    generalTxMetadata.insert(
      wasm.BigNum.from_str('0'),
      wasm.TransactionMetadatum.new_map(map),
    );
    const aux = wasm.AuxiliaryData.new();
    aux.set_metadata(generalTxMetadata);

    return aux.to_hex();
  };

  /**
   * generates transaction builder config using protocol params
   * @param params
   * @returns TransactionBuilderConfig
   */
  getTxBuilderConfig = (
    params: CardanoProtocolParams,
  ): wasm.TransactionBuilderConfig => {
    return wasm.TransactionBuilderConfigBuilder.new()
      .fee_algo(
        wasm.LinearFee.new(
          wasm.BigNum.from_str(params.min_fee_a.toString()),
          wasm.BigNum.from_str(params.min_fee_b.toString()),
        ),
      )
      .pool_deposit(wasm.BigNum.from_str(params.pool_deposit))
      .key_deposit(wasm.BigNum.from_str(params.key_deposit))
      .coins_per_utxo_byte(wasm.BigNum.from_str(params.coins_per_utxo_size))
      .max_value_size(params.max_value_size)
      .max_tx_size(params.max_tx_size)
      .prefer_pure_change(true)
      .build();
  };

  /**
   * converts utxo type from wallet type to CardanoUtxo
   *
   * THIS FUNCTION WORKS WITH UNWRAPPED VALUES
   *
   * @param serializedUtxo serialized hex string of TransactionUnspentOutput
   * @return CardanoUtxo
   */
  static walletUtxoToCardanoUtxo = (serializedUtxo: string): CardanoUtxo => {
    const utxo = wasm.TransactionUnspentOutput.from_hex(serializedUtxo);
    const assets: Array<CardanoAsset> = [];

    const multiAsset = utxo.output().amount().multiasset();
    if (multiAsset) {
      for (let i = 0; i < multiAsset.keys().len(); i++) {
        const policyId = multiAsset.keys().get(i);
        const policyAssets = multiAsset.get(policyId)!;
        for (let j = 0; j < policyAssets.len(); j++) {
          const assetName = policyAssets.keys().get(j);
          assets.push({
            policyId: policyId.to_hex(),
            assetName: Buffer.from(assetName.name()).toString('hex'),
            quantity: BigInt(policyAssets.get(assetName)!.to_str()),
          });
        }
      }
    }

    return {
      txId: utxo.input().transaction_id().to_hex(),
      index: utxo.input().index(),
      value: BigInt(utxo.output().amount().coin().to_str()),
      assets: assets,
      address: utxo.output().address().to_bech32(),
    };
  };

  /**
   * sets witness set into unsigned transaction
   * @param transactionHex
   * @param witnessSetHex
   * @returns hex representation of the signed transaction
   */
  static setTxWitnessSet = async (
    transactionHex: string,
    witnessSetHex: string,
  ): Promise<string> => {
    const witnessSet = wasm.TransactionWitnessSet.new();
    const tx = wasm.Transaction.from_hex(transactionHex);
    const vKeys = wasm.TransactionWitnessSet.from_bytes(
      Buffer.from(witnessSetHex, 'hex'),
    ).vkeys();
    if (vKeys) witnessSet.set_vkeys(vKeys);

    const signedTx = wasm.Transaction.new(
      tx.body(),
      witnessSet,
      tx.auxiliary_data(),
    );

    return signedTx.to_hex();
  };
}

export default CardanoRosenChainSDK;
