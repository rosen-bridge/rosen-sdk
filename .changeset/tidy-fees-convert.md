---
'@rosen-bridge/sdk-common': patch
---

Fix `convertFeeToAssetUnit` wrapping the network fee with the bridged token's decimals instead of the target chain's native token decimals, which made the converted fee 10^9 times too large when bridging most tokens to Ethereum or Binance
