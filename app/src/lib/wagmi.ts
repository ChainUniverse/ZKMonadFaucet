import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'ZK-Monad Faucet',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  chains: [monadTestnet],
  ssr: true,
});