import { useRunTracker } from './useRunTracker';
import './App.css';
import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'viem/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { ethers } from 'ethers';
import FYTSContract from './contracts/FYTSFitnessToken.json';

const CONTRACT_ADDRESS = '0x2955128a2ef2c7038381a5F56bcC21A91889595B';
const SEPOLIA_CHAIN_ID = 11155111;

const config = createConfig({
  chains: [sepolia, mainnet, polygon, arbitrum, optimism],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  connectors: [
    walletConnect({ 
      projectId: '794e2b891a07a5da78b220c48523541e',
      showQrModal: true,
      metadata: {
        name: 'FytS Fitness',
        description: 'Movement Validation Protocol',
        url: 'https://fyts.netlify.app',
        icons: ['https://fyts.netlify.app/icon.png']
      }
    }),
    injected(),
    coinbaseWallet({
      appName: 'FytS Fitness',
    }),
  ],
});

const queryClient = new QueryClient();

function AppContent() {
  const { state, stats, formattedStats, start, pause, resume, end, discard, addDistance } = useRunTracker();
  const { isConnected, address, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractBalance, setContractBalance] = useState('0');
  const [debugClicks, setDebugClicks] = useState(0);

  useEffect(() => {
    if (isConnected && address) {
      fetchContractBalance();
    }
  }, [isConnected, address]);

  const fetchContractBalance = async () => {
    if (!address || !(window as any).ethereum) return;
    
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FYTSContract.abi, provider);
      const balance = await contract.balanceOf(address);
      setContractBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  const submitValidation = async () => {
    if (!isConnected) {
      alert('Connect your wallet first!');
      return;
    }

    if (stats.distanceMeters < 100) {
      alert(`Too short! You have ${stats.distanceMeters.toFixed(0)}m, need 100m minimum`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        alert('Switch to Sepolia network in MetaMask!');
        setIsSubmitting(false);
        return;
      }

      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FYTSContract.abi, signer);
      
      const tx = await contract.submitValidation(
        Math.floor(stats.distanceMeters),
        Math.floor(stats.elapsedMs / 1000),
        `data:${JSON.stringify({distance: stats.distanceMeters, time: Date.now()})}`
      );
      
      alert('Sending to blockchain...');
      await tx.wait();
      
      alert('Success! Tokens pending admin approval');
      
      setValidationResult({
        success: true,
        tokens: (stats.distanceMeters * 0.001).toFixed(2),
        txHash: tx.hash
      });
      
      fetchContractBalance();
    } catch (error: any) {
      console.error(error);
      if (error.code === -32603 || error.message?.includes('insufficient funds')) {
        alert('You need Sepolia ETH for gas! Get free ETH from sepoliafaucet.com');
      } else {
        alert(`Error: ${error.message?.slice(0, 50) || 'Transaction failed'}`);
      }
    }
    
    setIsSubmitting(false);
  };

  const handleRunEnd = () => {
    end();
    if (stats.distanceMeters >= 100) {
      submitValidation();
    }
  };

  const handleDebugClick = () => {
    addDistance(100);
    setDebugClicks(prev => prev + 1);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h1 style={{fontSize: '2rem', margin: '0'}}>FYTS Fitness Tracker</h1>
        
        {isConnected ? (
          <div style={{marginTop: '10px'}}>
            <div>Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
            <div>Balance: {parseFloat(contractBalance).toFixed(2)} FYTS</div>
            {chain?.id !== SEPOLIA_CHAIN_ID && (
              <div style={{color: 'red'}}>⚠️ Switch to Sepolia Network!</div>
            )}
            <button 
              onClick={() => disconnect()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div style={{marginTop: '10px'}}>
            <p>Connect your wallet to start earning FYTS tokens!</p>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '20px'
      }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {stats.distanceMeters.toFixed(0)}m
          {debugClicks > 0 && (
            <div style={{fontSize: '1rem', color: '#666'}}>
              (+{debugClicks * 100}m debug)
            </div>
          )}
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>
              {formattedStats.duration}
            </div>
            <div style={{fontSize: '0.8rem', color: '#666'}}>Time</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>
              {formattedStats.pace}
            </div>
            <div style={{fontSize: '0.8rem', color: '#666'}}>Pace</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>
              {formattedStats.currentSpeed}
            </div>
            <div style={{fontSize: '0.8rem', color: '#666'}}>Speed</div>
          </div>
        </div>

        {state === 'idle' && (
          <button onClick={start} style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '15px',
            fontSize: '1.2rem',
            width: '100%',
            cursor: 'pointer'
          }}>
            START RUN
          </button>
        )}
        
        {(state === 'running' || state === 'stationary') && (
          <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={pause} style={{
              background: '#ffa500',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              fontSize: '1.2rem',
              flex: 1,
              cursor: 'pointer'
            }}>
              PAUSE
            </button>
            <button onClick={handleRunEnd} style={{
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              fontSize: '1.2rem',
              flex: 1,
              cursor: 'pointer'
            }} disabled={isSubmitting}>
              {isSubmitting ? 'SENDING...' : 'FINISH'}
            </button>
          </div>
        )}
        
        {state === 'paused' && (
          <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={resume} style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              fontSize: '1.2rem',
              flex: 1,
              cursor: 'pointer'
            }}>
              RESUME
            </button>
            <button onClick={handleRunEnd} style={{
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              fontSize: '1.2rem',
              flex: 1,
              cursor: 'pointer'
            }}>
              FINISH
            </button>
          </div>
        )}
        
        {state === 'ended' && (
          <div style={{
            background: '#e8f5e9',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h2>Run Complete!</h2>
            <p>Distance: {stats.distanceMeters.toFixed(0)}m</p>
            {validationResult && (
              <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50'}}>
                +{validationResult.tokens} FYTS earned!
              </div>
            )}
            <button onClick={() => {
              discard();
              setValidationResult(null);
              setDebugClicks(0);
            }} style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              marginTop: '15px',
              cursor: 'pointer'
            }}>
              NEW RUN
            </button>
          </div>
        )}
      </div>

      {state === 'running' && (
        <button onClick={handleDebugClick} style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          +100m
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}