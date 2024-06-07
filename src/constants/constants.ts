export const Networks = {
  ergo: "ergo",
  cardano: "cardano",
  bitcoin: "bitcoin",
} as const;

export const FEE_CONFIG_TOKEN_ID =
  "405cb1483b46340ee1a111aa42eaaffa53451cab3220fe9deb752a03f2ab0b85";

export const LOEN_FEE_CONFIG_TOKEN_ID =
  "05690d3e7a8daae13495b32af8ab58aaec8a5435f5974f6adf17095d28cac1f5";

// Tx Url
export const CARDANO_BASE_TX_URL = "https://cardanoscan.io/transaction/";
export const ERGO_BASE_TX_URL =
  "https://explorer.ergoplatform.com/transactions/";

// Explorer Urls
export const DEFAULT_CARDANO_EXPLORER_URL = "https://api.koios.rest/api/v1";
export const DEFAULT_ERGO_EXPLORER_URL = "https://api.ergoplatform.com/";
export const DEFAULT_BITCOIN_EXPLORER_URL = "https://blockstream.info/";

export const CARDANO_EXPLORER_URL =
  process.env.CARDANO_EXPLORER_URL !== undefined
    ? process.env.CARDANO_EXPLORER_URL
    : DEFAULT_CARDANO_EXPLORER_URL;
export const ERGO_EXPLORER_URL =
  process.env.ERGO_EXPLORER_URL !== undefined
    ? process.env.ERGO_EXPLORER_URL
    : DEFAULT_ERGO_EXPLORER_URL;
export const BITCOIN_EXPLORER_URL =
  process.env.BITCOIN_EXPLORER_URL !== undefined
    ? process.env.BITCOIN_EXPLORER_URL
    : DEFAULT_BITCOIN_EXPLORER_URL;

// Lock Addresses
export const DEFAULT_ERGO_LOCK_ADDRESS =
  "nB3L2PD3J4rMmyGk7nnNdESpPXxhPRQ4t1chF8LTXtceMQjKCEgL2pFjPY6cehGjyEFZyHEomBTFXZyqfonvxDozrTtK5JzatD8SdmcPeJNWPvdRb5UxEMXE4WQtpAFzt2veT8Z6bmoWN";
export const DEFAULT_CARDANO_LOCK_ADDRESS =
  "addr1v8kqhz5lkdxqm8qtkn4lgd9f4890v0j6advjfmk5k9amu4c535lsu";
export const DEFAULT_BITCOIN_LOCK_ADDRESS = "";

export const ERGO_LOCK_ADDRESS =
  process.env.ERGO_LOCK_ADDRESS !== undefined
    ? process.env.ERGO_LOCK_ADDRESS
    : DEFAULT_ERGO_LOCK_ADDRESS;
export const CARDANO_LOCK_ADDRESS =
  process.env.CARDANO_LOCK_ADDRESS !== undefined
    ? process.env.CARDANO_LOCK_ADDRESS
    : DEFAULT_CARDANO_LOCK_ADDRESS;
export const BITCOIN_LOCK_ADDRESS =
  process.env.BITCOIN_LOCK_ADDRESS !== undefined
    ? process.env.BITCOIN_LOCK_ADDRESS
    : DEFAULT_BITCOIN_LOCK_ADDRESS;
