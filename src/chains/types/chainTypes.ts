export interface IRosenChain {
  getBaseNetworkFee: () => bigint;
  generateUnsignedTx: (
    fromChain: string,
    toChain: string,
    toAddress: string,
    changeAddress: string,
    tokenId: string,
    amount: bigint
  ) => Promise<string>;
}
