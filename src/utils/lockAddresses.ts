import {
  BITCOIN_LOCK_ADDRESS,
  CARDANO_LOCK_ADDRESS,
  ERGO_LOCK_ADDRESS,
} from "../constants/constants";

/**
 * An object containing the lock addresses for different blockchain networks.
 */
export const LOCK_ADDRESSES = {
  /**
   * Lock address for the Ergo blockchain.
   */
  ergo: ERGO_LOCK_ADDRESS,

  /**
   * Lock address for the Cardano blockchain.
   */
  cardano: CARDANO_LOCK_ADDRESS,

  /**
   * Lock address for the Bitcoin blockchain.
   */
  bitcoin: BITCOIN_LOCK_ADDRESS,
};
