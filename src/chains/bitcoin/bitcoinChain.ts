import { IRosenChain } from "../../types/chainTypes";

export class BitcoinRosenChain implements IRosenChain {
  getBaseNetworkFee(): bigint {
    throw new Error("Not Implemented");
  }

  generateUnsignedTx(
    fromChain: string,
    toChain: string,
    toAddress: string,
    changeAddress: string,
    tokenId: string,
    amount: bigint
  ): Promise<any> {
    throw new Error("Not Implemented");
  }
}
