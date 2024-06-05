import { IRosenChain } from "../../types/chainTypes";

const CARDANO_BASE_NETWORK_FEE: bigint = 3400000n;

export class CardanoRosenChain implements IRosenChain {
  getBaseNetworkFee(): bigint {
    return CARDANO_BASE_NETWORK_FEE;
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
