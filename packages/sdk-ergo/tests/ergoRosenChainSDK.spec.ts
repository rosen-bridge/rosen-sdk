import {
  desireChangeBoxAsset,
  ergoBoxes,
  ergoLockAddress,
  rosenTokens,
} from './testData';
import { TokenMap } from '@rosen-bridge/tokens';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { ErgoRosenChainSDK } from '../lib';
import { Address, Constant, ErgoBox } from 'ergo-lib-wasm-nodejs';
import { FEE, MIN_BOX_VALUE } from '../lib/constants';
import { InsufficientAssetsException } from '../lib/errors';

describe(`ErgoRosenChainSDK`, () => {
  let tokenMap: TokenMap;
  beforeEach(async () => {
    // Reset mocks
    vi.resetAllMocks();
    tokenMap = new TokenMap();
    await tokenMap.updateConfigByJson(rosenTokens);
  });

  describe(`generateLockTransaction`, () => {
    /**
     * @target should generate lock transaction correctly with token bridging
     * @dependencies
     * @scenario
     * - call generateLockTransaction for RSN-Pandora from ergo to cardano
     * @expected
     * - should exist 3 outputs on unsinged transaction
     * - boxId of each inputsSigmaBytes in UnsignedGenerateTxProxy should be equal to unsignedTxProxy inputs' boxId
     * - ergoTree of lockBox should be equal to proper ergoLockAddress
     * - the value of lockBox should be equal MIN_BOX_VALUE in case of token bridging
     * - should exist exactly one asset in lock box with correct id and amount
     * - should fill R4 register in lockBox correctly
     * - ergoTree of changeBox should be equal to proper fromAddress with correct value and assets
     * - feeBox should have correct value
     */
    it(`should generate lock transaction correctly with token bridging`, async () => {
      const ergoRosenChainSDK = new ErgoRosenChainSDK(
        tokenMap,
        ergoLockAddress,
      );
      const rsnTokenIdOnErgo =
        'd752bede1a85891fff344604431fd6dc30ba685b382f2e0fe15da8141d36e34e'; // RSN-Pandora
      const toAddress =
        'addr1qyze7rcs29ad2c2ymy4mw50g8uvngd088vsxe0vk8nvqw93zma5v8lfqyjg7h368rpqw5jk8n3ncj5h2t4g0nnlaggnqd0s5sl';
      const fromAddress = '9eYh7EPyDThRJFqMYuRT6rzzd4h7ptDZS3ZJhKNG2rmKreeVbG3';
      const unsignedTx = await ergoRosenChainSDK.generateLockTransaction(
        rsnTokenIdOnErgo,
        NETWORKS.CARDANO,
        toAddress,
        fromAddress,
        10_000_000_000n,
        50_000_000n,
        24_150n,
        ergoBoxes.values(),
        1599000,
      );

      const lockBox = unsignedTx.unsignedTxProxy.outputs[0];
      const r4RegisterLockBox = Constant.decode_from_base16(
        lockBox.additionalRegisters['R4'],
      ).to_js();
      const changeBox = unsignedTx.unsignedTxProxy.outputs[1];
      const feeBox = unsignedTx.unsignedTxProxy.outputs[2];

      expect(unsignedTx.unsignedTxProxy.outputs.length).toEqual(3);
      unsignedTx.unsignedTxProxy.inputs.forEach((input, index) => {
        const fromInputSigmaBytes = ErgoBox.sigma_parse_bytes(
          Buffer.from(unsignedTx.inputsSigmaBytes[index], 'hex'),
        );
        expect(input.boxId).toEqual(fromInputSigmaBytes.box_id().to_str());
      });
      expect(lockBox.ergoTree).toEqual(
        Address.from_base58(ergoLockAddress).to_ergo_tree().to_base16_bytes(),
      );
      expect(lockBox.value).toEqual(MIN_BOX_VALUE.toString());
      expect(lockBox.assets.length).toEqual(1);
      expect(lockBox.assets[0].tokenId).toEqual(rsnTokenIdOnErgo);
      expect(lockBox.assets[0].amount).toEqual('10000000000');
      expect(Buffer.from(r4RegisterLockBox[0]).toString()).toEqual(
        NETWORKS.CARDANO,
      ); // to_chain
      expect(Buffer.from(r4RegisterLockBox[1]).toString()).toEqual(toAddress); // to_address
      expect(BigInt(Buffer.from(r4RegisterLockBox[2]).toString())).toEqual(
        24_150n,
      ); // network_fee
      expect(BigInt(Buffer.from(r4RegisterLockBox[3]).toString())).toEqual(
        50_000_000n,
      ); // bridge_fee
      expect(Buffer.from(r4RegisterLockBox[4]).toString()).toEqual(fromAddress); // from_address
      expect(changeBox.value).toEqual('1998600000');
      expect(changeBox.ergoTree).toEqual(
        Address.from_base58(fromAddress).to_ergo_tree().to_base16_bytes(),
      );
      expect(changeBox.assets.length).toEqual(1);
      expect(changeBox.assets).deep.equal(desireChangeBoxAsset);
      expect(feeBox.value).toEqual(FEE.toString());
    });

    /**
     * @target should generate lock transaction correctly with ERG bridging
     * @dependencies
     * @scenario
     * - call generateLockTransaction for ERG from ergo to ethereum
     * @expected
     * - should exist 3 outputs on unsinged transaction
     * - boxId of each inputsSigmaBytes in UnsignedGenerateTxProxy should be equal to unsignedTxProxy inputs' boxId
     * - ergoTree of lockBox should be equal to proper ergoLockAddress
     * - the lockBox should have correct value in case of Erg bridging
     * - the number of assets in lock box should be zero
     * - should fill R4 register in lockBox correctly
     * - ergoTree of changeBox should be equal to proper fromAddress with correct value and assets
     * - feeBox should have correct value
     */
    it(`should generate lock transaction correctly with ERG bridging`, async () => {
      const ergoRosenChainSDK = new ErgoRosenChainSDK(
        tokenMap,
        ergoLockAddress,
      );
      const ergTokenIdOnErgo = 'erg';

      const toAddress = '0xFBC0dcd6c3518cB529bC1B585dB992A7d40005fa';
      const fromAddress = '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW';
      const unsignedTx = await ergoRosenChainSDK.generateLockTransaction(
        ergTokenIdOnErgo,
        NETWORKS.ETHEREUM,
        toAddress,
        fromAddress,
        300_000_000n,
        3_000_000n,
        1_000_000n,
        ergoBoxes.values(),
        1599000,
      );

      const lockBox = unsignedTx.unsignedTxProxy.outputs[0];
      const r4RegisterLockBox = Constant.decode_from_base16(
        lockBox.additionalRegisters['R4'],
      ).to_js();
      const changeBox = unsignedTx.unsignedTxProxy.outputs[1];
      const feeBox = unsignedTx.unsignedTxProxy.outputs[2];

      expect(unsignedTx.unsignedTxProxy.outputs.length).toEqual(3);
      unsignedTx.unsignedTxProxy.inputs.forEach((input, index) => {
        const fromInputSigmaBytes = ErgoBox.sigma_parse_bytes(
          Buffer.from(unsignedTx.inputsSigmaBytes[index], 'hex'),
        );
        expect(input.boxId).toEqual(fromInputSigmaBytes.box_id().to_str());
      });
      expect(lockBox.ergoTree).toEqual(
        Address.from_base58(ergoLockAddress).to_ergo_tree().to_base16_bytes(),
      );
      expect(lockBox.value).toEqual('300000000');
      expect(lockBox.assets.length).toEqual(0);
      expect(Buffer.from(r4RegisterLockBox[0]).toString()).toEqual(
        NETWORKS.ETHEREUM,
      ); // to_chain
      expect(Buffer.from(r4RegisterLockBox[1]).toString()).toEqual(toAddress); // to_address
      expect(BigInt(Buffer.from(r4RegisterLockBox[2]).toString())).toEqual(
        1000000n,
      ); // network_fee
      expect(BigInt(Buffer.from(r4RegisterLockBox[3]).toString())).toEqual(
        3000000n,
      ); // bridge_fee
      expect(Buffer.from(r4RegisterLockBox[4]).toString()).toEqual(fromAddress); // from_address
      expect(changeBox.value).toEqual('699000000');
      expect(changeBox.ergoTree).toEqual(
        Address.from_base58(fromAddress).to_ergo_tree().to_base16_bytes(),
      );
      expect(changeBox.assets.length).toEqual(1);
      expect(changeBox.assets).deep.equal(desireChangeBoxAsset);
      expect(feeBox.value).toEqual(FEE.toString());
    });

    /**
     * @target should throw error in case of insufficient assets for bridging
     * @dependencies
     * @scenario
     * - call generateLockTransaction for ERG from ergo to ethereum
     * @expected
     * - should throw InsufficientAssetsException in case that utxoIterator doesn't cover `amount`
     */
    it(`should throw error in case of insufficient assets for bridging`, async () => {
      const ergoRosenChainSDK = new ErgoRosenChainSDK(
        tokenMap,
        ergoLockAddress,
      );
      const ergTokenIdOnErgo = 'erg';

      const fromAddress = '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW';
      const unsignedTx = ergoRosenChainSDK.generateLockTransaction(
        ergTokenIdOnErgo,
        NETWORKS.ETHEREUM,
        '0xFBC0dcd6c3518cB529bC1B585dB992A7d40005fa',
        fromAddress,
        30_000_000_000n,
        3_000_000n,
        1_000_000n,
        ergoBoxes.values(),
        1599000,
      );

      await expect(unsignedTx).rejects.toThrow(InsufficientAssetsException);
    });
  });
});
