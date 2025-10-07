'use client'

// Single configuration file for all supported chains
export interface ChainConfig {
  id: number
  name: string
  symbol: string
  color: string
  iconUrl?: string
  rpcUrl: string
  alchemyUrl: string
  etherscanUrl: string
  blockscoutUrl?: string
  explorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  isTestnet: boolean
}

// All supported chains configuration
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
    // Base Mainnet
    8453: {
      id: 8453,
      name: 'Base',
      symbol: 'ETH',
      color: '#0052FF',
      iconUrl: '/assets/8453.png',
      rpcUrl: 'https://mainnet.base.org',
      alchemyUrl: 'https://base-mainnet.g.alchemy.com/v2',
      etherscanUrl: 'https://api.basescan.org/api',
      blockscoutUrl: 'https://base.blockscout.com',
      explorerUrl: 'https://basescan.org',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      isTestnet: false
    },
  // Ethereum Mainnet
  1: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    iconUrl: '/assets/1.png',
    rpcUrl: 'https://eth.llamarpc.com',
    alchemyUrl: 'https://eth-mainnet.g.alchemy.com/v2',
    etherscanUrl: 'https://api.etherscan.io/api',
    blockscoutUrl: 'https://eth.blockscout.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    isTestnet: false
  },



  // Arbitrum One
  42161: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    color: '#28A0F0',
    iconUrl: '/assets/42161.png',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    alchemyUrl: 'https://arb-mainnet.g.alchemy.com/v2',
    etherscanUrl: 'https://api.arbiscan.io/api',
    blockscoutUrl: 'https://arbitrum.blockscout.com',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    isTestnet: false
  },

  // Optimism
  10: {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    color: '#FF0420',
    iconUrl: '/assets/10.png',
    rpcUrl: 'https://mainnet.optimism.io',
    alchemyUrl: 'https://opt-mainnet.g.alchemy.com/v2',
    etherscanUrl: 'https://api-optimistic.etherscan.io/api',
    blockscoutUrl: 'https://optimism.blockscout.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    isTestnet: false
  },

  // Polygon
  137: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    color: '#8247E5',
    iconUrl: '/assets/137.png',
    rpcUrl: 'https://polygon-rpc.com',
    alchemyUrl: 'https://polygon-mainnet.g.alchemy.com/v2',
    etherscanUrl: 'https://api.polygonscan.com/api',
    blockscoutUrl: 'https://polygon.blockscout.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    isTestnet: false
  },

  // Degen Chain
  666666666: {
    id: 666666666,
    name: 'Degen',
    symbol: 'DEGEN',
    color: '#FF6B35',
    iconUrl: '/assets/666666666.png',
    rpcUrl: 'https://rpc.degen.tips',
    alchemyUrl: 'https://degen-mainnet.g.alchemy.com/v2',
    etherscanUrl: '', // Not available
    blockscoutUrl: 'https://explorer.degen.tips',
    explorerUrl: 'https://explorer.degen.tips',
    nativeCurrency: {
      name: 'DEGEN',
      symbol: 'DEGEN',
      decimals: 18
    },
    isTestnet: false
  },

  // Gnosis Chain
  100: {
    id: 100,
    name: 'Gnosis',
    symbol: 'xDAI',
    color: '#48A9A6',
    iconUrl: '/assets/100.png',
    rpcUrl: 'https://rpc.gnosischain.com',
    alchemyUrl: 'https://gnosis-mainnet.g.alchemy.com/v2',
    etherscanUrl: '', // Not available
    blockscoutUrl: 'https://gnosis.blockscout.com',
    explorerUrl: 'https://gnosisscan.io',
    nativeCurrency: {
      name: 'xDAI',
      symbol: 'xDAI',
      decimals: 18
    },
    isTestnet: false
  },

  // Zora Network
  7777777: {
    id: 7777777,
    name: 'Zora',
    symbol: 'ETH',
    color: '#000000',
    iconUrl: '/assets/7777777.png',
    rpcUrl: 'https://rpc.zora.energy',
    alchemyUrl: 'https://zora-mainnet.g.alchemy.com/v2',
    etherscanUrl: '', // Not available
    blockscoutUrl: '', // Not available
    explorerUrl: 'https://explorer.zora.energy',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    isTestnet: false
  },

  // Unichain
  130: {
    id: 130,
    name: 'Unichain',
    symbol: 'UNI',
    color: '#FF6B6B',
    iconUrl: '/assets/130.png',
    rpcUrl: 'https://rpc.unichain.org',
    alchemyUrl: 'https://unichain-mainnet.g.alchemy.com/v2',
    etherscanUrl: '', // Not available
    blockscoutUrl: '', // Not available
    explorerUrl: 'https://explorer.unichain.org',
    nativeCurrency: {
      name: 'UNI',
      symbol: 'UNI',
      decimals: 18
    },
    isTestnet: false
  },

  // Monad
  10143: {
    id: 10143,
    name: 'Monad',
    symbol: 'MON',
    color: '#8B5CF6',
    iconUrl: '/assets/10143.png',
    rpcUrl: 'https://rpc.monad.xyz',
    alchemyUrl: 'https://monad-testnet.g.alchemy.com/v2',
    etherscanUrl: '', // Not available
    blockscoutUrl: '', // Not available
    explorerUrl: 'https://explorer.monad.xyz',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18
    },
    isTestnet: true
  },

  // Celo
  42220: {
    id: 42220,
    name: 'Celo',
    symbol: 'CELO',
    color: '#35D07F',
    iconUrl: '/assets/42220.png',
    rpcUrl: 'https://forno.celo.org',
    alchemyUrl: 'https://celo-mainnet.g.alchemy.com/v2',
    etherscanUrl: '', // Not available
    blockscoutUrl: '', // Not available
    explorerUrl: 'https://explorer.celo.org',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18
    },
    isTestnet: false
  },

  // HyperEVM
  999: {
    id: 999,
    name: 'HyperEVM',
    symbol: 'HYPE',
    color: '#FF6B35',
    iconUrl: '/assets/999.png',
    rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
    alchemyUrl: '', // Not available
    etherscanUrl: '', // Not available
    blockscoutUrl: '', // Not available
    explorerUrl: 'https://hyperevmscan.io',
    nativeCurrency: {
      name: 'HYPE',
      symbol: 'HYPE',
      decimals: 18
    },
    isTestnet: false
  }
}

// Helper functions
export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAIN_CONFIGS[chainId]
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(CHAIN_CONFIGS).join(', ')}`)
  }
  return config
}

export function getChainName(chainId: number): string {
  return getChainConfig(chainId).name
}

export function getChainSymbol(chainId: number): string {
  return getChainConfig(chainId).symbol
}

export function getChainColor(chainId: number): string {
  return getChainConfig(chainId).color
}

export function getAlchemyUrl(chainId: number): string {
  return getChainConfig(chainId).alchemyUrl
}

export function getEtherscanUrl(chainId: number): string {
  return getChainConfig(chainId).etherscanUrl
}

export function getBlockscoutUrl(chainId: number): string {
  const config = getChainConfig(chainId)
  if (!config.blockscoutUrl) {
    throw new Error(`Blockscout not available for chain ID: ${chainId}`)
  }
  return config.blockscoutUrl
}

export function getExplorerUrl(chainId: number): string {
  return getChainConfig(chainId).explorerUrl
}

export function getRpcUrl(chainId: number): string {
  return getChainConfig(chainId).rpcUrl
}

// Get all supported chain IDs
export function getSupportedChainIds(): number[] {
  return Object.keys(CHAIN_CONFIGS).map(Number)
}

// Get all supported chains as array
export function getAllChainConfigs(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS)
}

// Check if chain is supported
export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS
}

// Get chains by type
export function getMainnetChains(): ChainConfig[] {
  return getAllChainConfigs().filter(chain => !chain.isTestnet)
}

export function getTestnetChains(): ChainConfig[] {
  return getAllChainConfigs().filter(chain => chain.isTestnet)
}
