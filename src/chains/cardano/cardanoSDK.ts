import * as wasm from "@emurgo/cardano-serialization-lib-nodejs";
import { ADA_POLICY_ID } from "./types";
import {
  AssetBalance,
  CardanoUtxo,
  selectCardanoUtxos,
} from "@rosen-bridge/cardano-utxo-selection";
import { feeAndMinBoxValue } from "./consts";
import { AssetBalanceMath } from "../../utils/assetBalanceMath";
import { BoxInfoExtractor } from "../../utils/boxInfo";
import { RosenChainToken } from "@rosen-bridge/tokens";
import cardanoKoiosClientFactory from "@rosen-clients/cardano-koios";
import {
  InsufficientAssetsException,
  InvalidArgumentException,
} from "../../errors";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { LOCK_ADDRESSES } from "../../utils/lockAddresses";
import { CardanoProtocolParams } from "./types/cardanoTypes";
import { CARDANO_EXPLORER_URL } from "../../constants/constants";

export class CardanoRosenSDK {
  /**
   * generates metadata for lock transaction
   * @param toChain
   * @param toAddress
   * @param fromAddress fromAddress should be in bech32
   * @param networkFee
   * @param bridgeFee
   */
  public static async generateLockAuxiliaryData(
    toChain: string,
    toAddress: string,
    fromAddress: string,
    networkFee: string,
    bridgeFee: string
  ): Promise<string> {
    // generate metadata json
    const metadataJson = {
      to: toChain,
      bridgeFee: bridgeFee,
      networkFee: networkFee,
      toAddress,
    };
    const map = wasm.MetadataMap.new();
    for (const key in metadataJson) {
      map.insert(
        wasm.TransactionMetadatum.new_text(key),
        wasm.TransactionMetadatum.new_text(
          metadataJson[key as keyof typeof metadataJson]
        )
      );
    }

    const fromAddressList = wasm.MetadataList.new();
    let i = 0;
    while (i < fromAddress.length) {
      fromAddressList.add(
        wasm.TransactionMetadatum.new_text(fromAddress.substring(i, i + 64))
      );
      i += 64;
    }

    map.insert(
      wasm.TransactionMetadatum.new_text("fromAddress"),
      wasm.TransactionMetadatum.new_list(fromAddressList)
    );
    const generalTxMetadata = wasm.GeneralTransactionMetadata.new();
    generalTxMetadata.insert(
      wasm.BigNum.from_str("0"),
      wasm.TransactionMetadatum.new_map(map)
    );
    const aux = wasm.AuxiliaryData.new();
    aux.set_metadata(generalTxMetadata);
    return aux.to_hex();
  }

  /**
   *
   * @param token Token to be bridged
   * @param toChain Chain the token has to be bridged to
   * @param toAddress destination address of the chain
   * @param changeAddress the cardano address in bech32
   * @param amount the amount of tokens to be bridged
   * @param bridgeFee the bridge fee
   * @param networkFee the network fee
   * @param utxoIterator the utxo boxes of the address
   * @param lockAddress the rosen bridge lock address
   * @param height height of the blockchain
   * @param logger logger
   * @returns
   */
  public static async generateLockTransaction(
    token: RosenChainToken,
    toChain: string,
    toAddress: string,
    changeAddress: string,
    amount: bigint,
    bridgeFee: bigint,
    networkFee: bigint,
    utxoIterator:
      | AsyncIterator<CardanoUtxo, undefined>
      | Iterator<CardanoUtxo, undefined>,
    lockAddress: string = LOCK_ADDRESSES.cardano,
    logger?: AbstractLogger
  ): Promise<string> {
    if (
      (utxoIterator as AsyncIterator<CardanoUtxo, undefined>) === null ||
      (utxoIterator as Iterator<CardanoUtxo, undefined>) === null
    ) {
      throw new InvalidArgumentException(
        "[Generate Lock Transaction] UtxoIterator does not have CardanoUtxo"
      );
    }
    const auxiliaryDataHex = await this.generateLockAuxiliaryData(
      toChain,
      toAddress,
      changeAddress,
      networkFee.toString(),
      bridgeFee.toString()
    );
    const policyIdHex = token.policyId;
    const assetNameHex = token.assetName;
    const protocolParams = await this.getCardanoProtocolParams();

    return await this.generateCardanoLockTransaction(
      changeAddress,
      lockAddress,
      utxoIterator,
      policyIdHex,
      assetNameHex,
      amount,
      auxiliaryDataHex,
      protocolParams
    );
  }

  /**
   * generates a lock transaction on Cardano
   * @param protocolParams The Cardano protocol params
   * @param utxoIterator an Iterator object that is used to fetch input utxos
   * @param lockAddress
   * @param changeAddress this address has to be in bech32 format
   * @param policyIdHex transferring asset policy ID (empty string in case of ADA transfer)
   * @param assetNameHex transferring asset name in hex
   * @param amount
   * @param auxiliaryDataHex
   * @returns hex representation of the unsigned tx
   */
  public static async generateCardanoLockTransaction(
    changeAddress: string,
    lockAddress: string,
    utxoIterator:
      | AsyncIterator<CardanoUtxo, undefined>
      | Iterator<CardanoUtxo, undefined>,
    policyIdHex: string,
    assetNameHex: string,
    amount: bigint,
    auxiliaryDataHex: string,
    protocolParams: CardanoProtocolParams
  ): Promise<string> {
    if (
      (utxoIterator as AsyncIterator<CardanoUtxo, undefined>) === null ||
      (utxoIterator as Iterator<CardanoUtxo, undefined>) === null
    ) {
      throw new InvalidArgumentException(
        "[Generate Lock Transaction] UtxoIterator does not have ErgoBoxProxy"
      );
    }

    const auxiliaryData = wasm.AuxiliaryData.from_hex(auxiliaryDataHex);
    const txBuilder = wasm.TransactionBuilder.new(
      this.getTxBuilderConfig(protocolParams)
    );

    // generate lock box
    const lockAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    if (policyIdHex === ADA_POLICY_ID) {
      // lock ADA
      lockAssets.nativeToken = amount;
    } else {
      // lock asset
      lockAssets.tokens.push({
        id: `${policyIdHex}.${assetNameHex}`,
        value: amount,
      });
    }
    const lockBox = this.generateOutputBox(
      lockAssets,
      lockAddress,
      protocolParams.coins_per_utxo_size
    );

    // add lock box to tx and calculate required assets to get input boxes
    lockAssets.nativeToken = BigInt(lockBox.amount().coin().to_str());
    const requiredAssets: AssetBalance = structuredClone(lockAssets);
    txBuilder.add_output(lockBox);

    // add required ADA estimation for tx fee and change box
    requiredAssets.nativeToken += feeAndMinBoxValue;

    // get input boxes
    const inputs = await selectCardanoUtxos(
      requiredAssets,
      [],
      new Map(),
      utxoIterator
    );

    if (!inputs.covered) throw new InsufficientAssetsException();
    let inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    // add input boxes to transaction
    inputs.boxes.forEach((utxo) => {
      inputAssets = AssetBalanceMath.sum(
        inputAssets,
        BoxInfoExtractor.getAssetBalance(utxo)
      );
      txBuilder.add_input(
        wasm.Address.from_bech32(utxo.address),
        wasm.TransactionInput.new(
          wasm.TransactionHash.from_hex(utxo.txId),
          utxo.index
        ),
        lockBox.amount()
      );
    });

    // set temp fee and auxiliary data
    txBuilder.set_fee(txBuilder.min_fee());
    txBuilder.set_auxiliary_data(auxiliaryData);

    // calculate change box assets and transaction fee
    const changeAssets = AssetBalanceMath.subtract(inputAssets, lockAssets);
    const tempChangeBox = this.generateOutputBox(
      changeAssets,
      changeAddress,
      protocolParams.coins_per_utxo_size
    );
    const fee = txBuilder
      .min_fee()
      .checked_add(txBuilder.fee_for_output(tempChangeBox));
    changeAssets.nativeToken -= BigInt(fee.to_str());
    const changeBox = this.generateOutputBox(
      changeAssets,
      changeAddress,
      protocolParams.coins_per_utxo_size
    );
    txBuilder.add_output(changeBox);

    // set tx fee
    txBuilder.set_fee(fee);

    // build transaction
    const txBody = txBuilder.build();

    // build unsigned transaction object
    const witnessSet = wasm.TransactionWitnessSet.new();
    const tx = wasm.Transaction.new(txBody, witnessSet, auxiliaryData);
    return tx.to_hex();
  }

  // <utils>
  /**
   * generates transaction builder config using protocol params
   * @param params
   * @returns
   */
  private static getTxBuilderConfig(
    params: CardanoProtocolParams
  ): wasm.TransactionBuilderConfig {
    return wasm.TransactionBuilderConfigBuilder.new()
      .fee_algo(
        wasm.LinearFee.new(
          wasm.BigNum.from_str(params.min_fee_a.toString()),
          wasm.BigNum.from_str(params.min_fee_b.toString())
        )
      )
      .pool_deposit(wasm.BigNum.from_str(params.pool_deposit))
      .key_deposit(wasm.BigNum.from_str(params.key_deposit))
      .coins_per_utxo_byte(wasm.BigNum.from_str(params.coins_per_utxo_size))
      .max_value_size(params.max_value_size)
      .max_tx_size(params.max_tx_size)
      .prefer_pure_change(true)
      .build();
  }

  /**
   * generates cardano box in TransactionOutput type
   * @param balance
   * @param address
   * @returns
   */
  private static generateOutputBox(
    balance: AssetBalance,
    address: string,
    coinsPerUtxoByte: string
  ): wasm.TransactionOutput {
    let changeBoxBuilder = wasm.TransactionOutputBuilder.new()
      .with_address(wasm.Address.from_bech32(address))
      .next();

    let multiAsset = wasm.MultiAsset.new();
    balance.tokens.forEach((token) => {
      const assetUnit = token.id.split(".");
      const policyId = wasm.ScriptHash.from_hex(assetUnit[0]);
      const assetName = wasm.AssetName.new(Buffer.from(assetUnit[1], "hex"));
      multiAsset.set_asset(
        policyId,
        assetName,
        wasm.BigNum.from_str(token.value.toString())
      );
    });

    return balance.nativeToken
      ? changeBoxBuilder
          .with_value(
            wasm.Value.new_with_assets(
              wasm.BigNum.from_str(balance.nativeToken.toString()),
              multiAsset
            )
          )
          .build()
      : changeBoxBuilder
          .with_asset_and_min_required_coin_by_utxo_cost(
            multiAsset,
            wasm.DataCost.new_coins_per_byte(
              wasm.BigNum.from_str(coinsPerUtxoByte)
            )
          )
          .build();
  }
  /**
   * gets Cardano protocol params
   * @returns
   */
  static async getCardanoProtocolParams(): Promise<CardanoProtocolParams> {
    const cardanoKoiosClient = cardanoKoiosClientFactory(CARDANO_EXPLORER_URL);
    return await cardanoKoiosClient.getEpochParams().then((epochParams) => {
      const params = epochParams[0];
      if (
        !params.min_fee_a ||
        !params.min_fee_b ||
        !params.pool_deposit ||
        !params.key_deposit ||
        !params.max_val_size ||
        !params.max_tx_size ||
        !params.coins_per_utxo_size
      )
        throw Error(
          `Some required Cardano protocol params fetched from koios are undefined or null `
        );
      return {
        min_fee_a: params.min_fee_a,
        min_fee_b: params.min_fee_b,
        pool_deposit: params.pool_deposit,
        key_deposit: params.key_deposit,
        max_value_size: params.max_val_size,
        max_tx_size: params.max_tx_size,
        coins_per_utxo_size: params.coins_per_utxo_size,
      };
    });
  }
  // </utils>
}
