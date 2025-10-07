export interface Approval {
  id: string
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  tokenDecimals: number
  spender: string
  spenderName?: string
  type: 'ERC20' | 'ERC721' | 'ERC1155'
  allowance: string
  amount: string
  formattedAmount?: string
  source?: string
  blockNumber: number
  transactionHash: string
  timestamp: number
  // Token metadata from Alchemy
  tokenLogo?: string
  tokenDescription?: string
  tokenWebsite?: string
  tokenTwitter?: string
  tokenDiscord?: string
  tokenTelegram?: string
  // Moralis enrichment (optional)
  tokenAddressLabel?: string
  tokenCurrentBalance?: string
  tokenCurrentBalanceFormatted?: string
  tokenUsdPrice?: string
  tokenUsdAtRisk?: string
  tokenVerifiedContract?: boolean
  tokenPossibleSpam?: boolean
}

export interface RevokeCall {
  to: string
  data: string
  value: string
}

export interface BatchCall {
  calls: RevokeCall[]
  atomicRequired: boolean
}

export interface TransactionStatus {
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  hash?: string
  error?: string
  message?: string
}

export interface WalletCapabilities {
  atomicBatch: boolean
  paymasterService?: boolean
  gasSponsorship?: boolean
}

export interface BlockscoutTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  input: string
  gas: string
  gasPrice: string
  gasUsed: string
  isError: string
  methodId: string
  functionName: string
}

export interface BlockscoutTokenTransfer {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
  contractAddress: string
}

export interface BlockscoutNFTTransfer {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  tokenID: string
  tokenName: string
  tokenSymbol: string
  contractAddress: string
}
