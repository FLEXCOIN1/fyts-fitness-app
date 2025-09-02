import { createConfig, http } from 'wagmi'
import { polygon } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = '794e2b891a07a5da78b220c48523541e' // Replace with your WalletConnect project ID

export const config = createConfig({
  chains: [polygon],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [polygon.id]: http(),
  },
})