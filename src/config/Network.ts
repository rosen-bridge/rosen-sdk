import { NetworkConfig } from "./RosenSDKConfig";
import cardanoKoiosClientFactory from "@rosen-clients/cardano-koios";
import ergoExplorerClientFactory from "@rosen-clients/ergo-explorer";
import { Networks } from "../constants/constants";

export interface Height {
  cardano: () => Promise<number | null | undefined>;
  ergo: () => Promise<number>;
  bitcoin: () => Promise<number>;
}
export class Network {
  private ergoClient: ReturnType<typeof ergoExplorerClientFactory>;
  private cardanoClient: ReturnType<typeof cardanoKoiosClientFactory>;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.ergoClient = ergoExplorerClientFactory(networkConfig.ErgoExplorerAPI);
    this.cardanoClient = cardanoKoiosClientFactory(
      networkConfig.CardanoExplorerAPI
    );
    this.networkConfig = networkConfig;
  }

  getExplorerUrl(chain: keyof typeof Networks): string {
    switch (chain) {
      case "ergo":
        return this.networkConfig.ErgoExplorerAPI;
      case "cardano":
        return this.networkConfig.CardanoExplorerAPI;
      case "bitcoin":
        return this.networkConfig.BitcoinExplorerAPI;
      default:
        return "";
    }
  }

  async getHeight(chain: keyof typeof Networks): Promise<number> {
    switch (chain) {
      case "cardano": {
        const cardanoBlock = (await this.cardanoClient.getTip())[0].block_no;
        return cardanoBlock !== null && cardanoBlock !== undefined
          ? cardanoBlock
          : 0;
      }
      case "ergo": {
        return Number((await this.ergoClient.v1.getApiV1Networkstate()).height);
      }
      case "bitcoin": {
        const response = await fetch(
          `${this.networkConfig.BitcoinExplorerAPI}/blocks/tip/height`
        );
        return response.json();
      }
      default:
        throw new Error("error");
    }
  }
}
