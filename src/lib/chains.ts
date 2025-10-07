import { defineChain } from 'viem'
import { CHAIN_CONFIGS } from './chain-config'

// Generate Viem chains from config
export const ethereumMainnet = defineChain({
  id: CHAIN_CONFIGS[1].id,
  name: CHAIN_CONFIGS[1].name,
  nativeCurrency: CHAIN_CONFIGS[1].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[1].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[1].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: CHAIN_CONFIGS[1].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[1].isTestnet,
})

export const baseMainnet = defineChain({
  id: CHAIN_CONFIGS[8453].id,
  name: CHAIN_CONFIGS[8453].name,
  nativeCurrency: CHAIN_CONFIGS[8453].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[8453].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[8453].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: CHAIN_CONFIGS[8453].explorerUrl },
    blockscout: { name: 'Blockscout', url: CHAIN_CONFIGS[8453].blockscoutUrl! },
  },
  testnet: CHAIN_CONFIGS[8453].isTestnet,
})

export const arbitrumOne = defineChain({
  id: CHAIN_CONFIGS[42161].id,
  name: CHAIN_CONFIGS[42161].name,
  nativeCurrency: CHAIN_CONFIGS[42161].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[42161].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[42161].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: CHAIN_CONFIGS[42161].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[42161].isTestnet,
})

export const optimismMainnet = defineChain({
  id: CHAIN_CONFIGS[10].id,
  name: CHAIN_CONFIGS[10].name,
  nativeCurrency: CHAIN_CONFIGS[10].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[10].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[10].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Optimism Explorer', url: CHAIN_CONFIGS[10].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[10].isTestnet,
})

export const polygonMainnet = defineChain({
  id: CHAIN_CONFIGS[137].id,
  name: CHAIN_CONFIGS[137].name,
  nativeCurrency: CHAIN_CONFIGS[137].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[137].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[137].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: CHAIN_CONFIGS[137].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[137].isTestnet,
})

export const degenChain = defineChain({
  id: CHAIN_CONFIGS[666666666].id,
  name: CHAIN_CONFIGS[666666666].name,
  nativeCurrency: CHAIN_CONFIGS[666666666].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[666666666].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[666666666].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Degen Explorer', url: CHAIN_CONFIGS[666666666].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[666666666].isTestnet,
})

export const gnosisMainnet = defineChain({
  id: CHAIN_CONFIGS[100].id,
  name: CHAIN_CONFIGS[100].name,
  nativeCurrency: CHAIN_CONFIGS[100].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[100].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[100].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Gnosis Explorer', url: CHAIN_CONFIGS[100].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[100].isTestnet,
})

export const zoraMainnet = defineChain({
  id: CHAIN_CONFIGS[7777777].id,
  name: CHAIN_CONFIGS[7777777].name,
  nativeCurrency: CHAIN_CONFIGS[7777777].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[7777777].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[7777777].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Zora Explorer', url: CHAIN_CONFIGS[7777777].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[7777777].isTestnet,
})

export const unichainMainnet = defineChain({
  id: CHAIN_CONFIGS[130].id,
  name: CHAIN_CONFIGS[130].name,
  nativeCurrency: CHAIN_CONFIGS[130].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[130].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[130].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Unichain Explorer', url: CHAIN_CONFIGS[130].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[130].isTestnet,
})

export const monadMainnet = defineChain({
  id: CHAIN_CONFIGS[10143].id,
  name: CHAIN_CONFIGS[10143].name,
  nativeCurrency: CHAIN_CONFIGS[10143].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[10143].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[10143].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: CHAIN_CONFIGS[10143].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[10143].isTestnet,
})

export const celoMainnet = defineChain({
  id: CHAIN_CONFIGS[42220].id,
  name: CHAIN_CONFIGS[42220].name,
  nativeCurrency: CHAIN_CONFIGS[42220].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[42220].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[42220].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: CHAIN_CONFIGS[42220].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[42220].isTestnet,
})

export const hyperevmMainnet = defineChain({
  id: CHAIN_CONFIGS[999].id,
  name: CHAIN_CONFIGS[999].name,
  nativeCurrency: CHAIN_CONFIGS[999].nativeCurrency,
  rpcUrls: {
    default: { http: [CHAIN_CONFIGS[999].rpcUrl] },
    public: { http: [CHAIN_CONFIGS[999].rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Explorer', url: CHAIN_CONFIGS[999].explorerUrl },
  },
  testnet: CHAIN_CONFIGS[999].isTestnet,
})


// All supported chains
export const SUPPORTED_CHAINS = {
  1: ethereumMainnet,
  8453: baseMainnet,
  42161: arbitrumOne,
  10: optimismMainnet,
  137: polygonMainnet,
  666666666: degenChain,
  100: gnosisMainnet,
  7777777: zoraMainnet,
  130: unichainMainnet,
  10143: monadMainnet,
  42220: celoMainnet,
  999: hyperevmMainnet,
}

// Re-export from chain-config for convenience
export { 
  getChainConfig,
  getChainName,
  getChainSymbol,
  getChainColor,
  getAlchemyUrl,
  getEtherscanUrl,
  getBlockscoutUrl,
  getExplorerUrl,
  getRpcUrl,
  getSupportedChainIds,
  getAllChainConfigs,
  isChainSupported,
  getMainnetChains,
  getTestnetChains
} from './chain-config'
