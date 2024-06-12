import { Networks } from "../constants/constants";
import { ChainNotSupportedException } from "../errors";
import { BitcoinRosenChain } from "./bitcoin/bitcoinChain";
import { CardanoRosenChain } from "./cardano/cardanoChain";
import { ErgoRosenChain } from "./ergo/ergoChain";

export class RosenChains {
  static getBaseNetworkFee(chain: keyof typeof Networks): bigint {
    switch (chain) {
      case Networks.ergo:
        return new ErgoRosenChain().getBaseNetworkFee();
      case Networks.cardano:
        return new CardanoRosenChain().getBaseNetworkFee();
      case Networks.bitcoin:
        return new BitcoinRosenChain().getBaseNetworkFee();
      default:
        throw new ChainNotSupportedException();
    }
  }

  static getLockTransaction(
    fromChain: keyof typeof Networks,
    toChain: keyof typeof Networks,
    toAddress: string,
    changeAddress: string,
    tokenId: string,
    amount: bigint
  ): Promise<string> {
    switch (fromChain) {
      case "ergo":
        new ErgoRosenChain().generateUnsignedTx(
          fromChain,
          toChain,
          toAddress,
          changeAddress,
          tokenId,
          amount
        );
      case "cardano":
        new CardanoRosenChain().generateUnsignedTx(
          fromChain,
          toChain,
          toAddress,
          changeAddress,
          tokenId,
          amount
        );
      case "bitcoin":
        new BitcoinRosenChain().generateUnsignedTx(
          fromChain,
          toChain,
          toAddress,
          changeAddress,
          tokenId,
          amount
        );
      default:
        throw new ChainNotSupportedException();
    }
  }
}
