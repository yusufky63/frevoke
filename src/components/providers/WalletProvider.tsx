'use client'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SUPPORTED_CHAINS } from '@/lib/chains'

const queryClient = new QueryClient()

// Get RPC URL from environment (unused for now)
// const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'

// Create connectors based on environment
const connectors = []

// Always try Farcaster connector first
connectors.push(miniAppConnector())

// Add injected connector as fallback for web development
if (typeof window !== 'undefined') {
  connectors.push(injected({ shimDisconnect: true }))
}

// Get all supported chains
const supportedChains = Object.values(SUPPORTED_CHAINS)

// Create transports for all chains
const transports = supportedChains.reduce((acc, chain) => {
  acc[chain.id] = http(chain.rpcUrls.default.http[0])
  return acc
}, {} as Record<number, ReturnType<typeof http>>)

const config = createConfig({
  chains: supportedChains as [typeof supportedChains[0], ...typeof supportedChains],
  transports,
  connectors,
})

// OnchainKit configuration (unused for now)
// const onchainKitConfig = {
//   apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || '',
//   chain: baseMainnet,
// }

interface WalletProviderProps {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider chain={SUPPORTED_CHAINS[8453]}>
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
