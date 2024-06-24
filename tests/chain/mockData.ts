export const mockInputBox = {
  trueBox: {
    boxId: "f27ae64ffe94ca6bf6b8ac2a271dd71dae664086375427b29080b77f146e7e55",
    value: 49806995894n,
    index: 0,
    creationHeight: 970810,
    ergoTree: "10010101d17300",
    address: "4MQyML64GnzMxZgm",
  },
  box1: {
    boxId: "6b1ac2e2b3fbbdb5abde76262e57e8dfb930e7728b5e3b57f2ca261fcd764d9f",
    value: 49806995894n,
    index: 0,
    creationHeight: 970810,
    ergoTree:
      "0008cd0391a9ffcade3b453244d4736258b9cbfc450f2e66881d5396e66d75b1ddc42b3c",
    address: "9hZxV3YNSfbCqS6GEses7DhAVSatvaoNtdsiNvkimPGG2c8fzkG",
    assets: [
      {
        tokenId:
          "fc6c2070eb004fc08fcde1514dee56b1d0587477748d8af647179b098f52f559",
        amount: 28188826954n,
      },
      {
        tokenId:
          "517c91b4ea680166ddd3f67b27b0274c20bbd2aeb82b60eaf5bf5471b37f684a",
        amount: 787124867n,
      },
      {
        tokenId:
          "10278c102bf890fdab8ef5111e94053c90b3541bc25b0de2ee8aa6305ccec3de",
        amount: 970090041n,
      },
      {
        tokenId:
          "37080ea7925c407965f27013fe66d2e7d692e68dc0de9219effe4819cea8c7b3",
        amount: 1n,
      },
    ],
  },
  box2: {
    boxId: "b563cd232ae9b8792131d4f461d7ee2fbec6bb1d2b4b9757b16b28e5265c9197",
    value: 1000000n,
    index: 2,
    creationHeight: 970819,
    ergoTree:
      "0008cd0391a9ffcade3b453244d4736258b9cbfc450f2e66881d5396e66d75b1ddc42b3c",
    address: "9hZxV3YNSfbCqS6GEses7DhAVSatvaoNtdsiNvkimPGG2c8fzkG",
    assets: [
      {
        tokenId:
          "fc6c2070eb004fc08fcde1514dee56b1d0587477748d8af647179b098f52f559",
        amount: 28188826954n,
      },
      {
        tokenId:
          "517c91b4ea680166ddd3f67b27b0274c20bbd2aeb82b60eaf5bf5471b37f684a",
        amount: 787124867n,
      },
      {
        tokenId:
          "10278c102bf890fdab8ef5111e94053c90b3541bc25b0de2ee8aa6305ccec3de",
        amount: 970090041n,
      },
      {
        tokenId:
          "37080ea7925c407965f27013fe66d2e7d692e68dc0de9219effe4819cea8c7b3",
        amount: 1n,
      },
    ],
  },
};

export const fromAddressCardanoHex =
  "011ae5997712a7b44bf5c73b2bb6497210d1d6dd961d3b40c05c3adaa83017b818d86b5e8e74e1c2957f93dbcd0d2f3870717bef4ea4b78a71";
export const blockFrostRosenData = {
  validTokenLock: {
    toChain: "ergo",
    toAddress: "ergoAddress",
    bridgeFee: "1968503938",
    networkFee: "9842520",
    fromAddress:
      "addr1qydwtxthz2nmgjl4cuajhdjfwggdr4kajcwnksxqtsad42psz7up3krtt688fcwzj4le8k7dp5hnsur300h5af9h3fcs2fm358",
    sourceChainTokenId:
      "3122541486c983d637e7ed9330c94e490e1fe4a1758725fab7f6d9e0.72734254432d6c6f656e",
    amount: "9899899",
    targetChainTokenId:
      "98bc813d77b8b938fddb08f75c5c686ffe38cf1d99a887f91403cc6f0c5c76bf",
    sourceTxId: "",
  },
  validAdaLock: {
    toChain: "ergo",
    toAddress: "ergoAddress",
    bridgeFee: "10000000",
    networkFee: "4000000",
    fromAddress:
      "addr1qydwtxthz2nmgjl4cuajhdjfwggdr4kajcwnksxqtsad42psz7up3krtt688fcwzj4le8k7dp5hnsur300h5af9h3fcs2fm358",
    sourceChainTokenId: "ada",
    amount: "80000000",
    targetChainTokenId:
      "0bf47c19e49944a38948c635c0aef93d89737aa68df5ad881b07c8f9a63e398d",
    sourceTxId: "",
  },
};

export const ergoRosenData = {
  lockTx: {
    toChain: "cardano",
    toAddress:
      "addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwfq8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6",
    bridgeFee: "200000000",
    networkFee: "1000000",
    fromAddress: "9hZxV3YNSfbCqS6GEses7DhAVSatvaoNtdsiNvkimPGG2c8fzkG",
    sourceChainTokenId: "erg",
    amount: "384284957",
    targetChainTokenId:
      "fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48.77724552472d6c6f656e",
    sourceTxId:
      "d59413c7500c75b525e30d992ae3869d91ce5a542f3f7c12d9e39af90f7151c8",
  },
  bitcoinTx: {
    toChain: "cardano",
    toAddress:
      "addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwfq8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6",
    bridgeFee: "200000000",
    networkFee: "1000000",
    fromAddress: "9hZxV3YNSfbCqS6GEses7DhAVSatvaoNtdsiNvkimPGG2c8fzkG",
    sourceChainTokenId:
      "98bc813d77b8b938fddb08f75c5c686ffe38cf1d99a887f91403cc6f0c5c76bf",
    amount: "384284957",
    targetChainTokenId:
      "3122541486c983d637e7ed9330c94e490e1fe4a1758725fab7f6d9e0.72734254432d6c6f656e",
    sourceTxId:
      "b0a27bf8b8464ee72611f4da97937fd6e03db4ac716654809063ddbc035fbb26",
  },
};
