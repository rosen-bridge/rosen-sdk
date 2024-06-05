import { IRosenChain } from "../../types/chainTypes";

const ERGO_BASE_NETWORK_FEE: bigint = 1300000n;

export class ErgoRosenChain implements IRosenChain {
  getBaseNetworkFee(): bigint {
    return ERGO_BASE_NETWORK_FEE;
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
