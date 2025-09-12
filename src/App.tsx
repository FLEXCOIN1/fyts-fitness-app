import { useRunTracker } from './useRunTracker';
import './App.css';
import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { useAccount, WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'viem/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { ethers } from 'ethers';
import FYTSContract from './contracts/FYTSFitnessToken.json';
import LegalDisclaimer from './components/Legaldisclaimer';
import StakingDashboard from './components/StakingDashboard';
import LeaderboardsDashboard from './components/LeaderboardsDashboard';

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
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractBalance, setContractBalance] = useState('0');
  const [activeTab, setActiveTab] = useState<string>('tracker');
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

  // Vibrant Smash style inline CSS
  const styles = {
    container: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '10px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowX: 'hidden' as const
    },
    header: {
      background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
      borderRadius: '25px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      textAlign: 'center' as const
    },
    title: {
      background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      fontWeight: '900',
      margin: '0',
      letterSpacing: '-1px'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666',
      marginTop: '5px'
    },
    balanceBox: {
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      borderRadius: '15px',
      padding: '12px',
      marginTop: '10px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: '#5f27cd',
      display: 'inline-block'
    },
    mainCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '25px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    },
    distanceDisplay: {
      fontSize: 'clamp(3rem, 8vw, 4rem)',
      fontWeight: '900',
      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textAlign: 'center' as const,
      margin: '20px 0'
    },
    startButton: {
      background: 'linear-gradient(45deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 100%)',
      border: 'none',
      borderRadius: '50px',
      padding: '20px 40px',
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      width: '100%',
      marginTop: '20px',
      animation: 'pulse 2s infinite'
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px',
      flexWrap: 'wrap' as const
    },
    actionButton: {
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      border: 'none',
      borderRadius: '20px',
      padding: '15px 25px',
      fontSize: '1.2rem',
      cursor: 'pointer',
      boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
      color: 'white',
      fontWeight: 'bold',
      minWidth: '120px'
    },
    debugButton: {
      position: 'fixed' as const,
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      border: 'none',
      borderRadius: '20px',
      padding: '12px 20px',
      color: 'white',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
      zIndex: 1000
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: '10px',
      marginTop: '20px'
    },
    statCard: {
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      borderRadius: '15px',
      padding: '15px',
      textAlign: 'center' as const,
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#5f27cd'
    },
    statLabel: {
      fontSize: '0.8rem',
      color: '#666',
      marginTop: '3px'
    },
    completionCard: {
      background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      borderRadius: '20px',
      padding: '25px',
      textAlign: 'center' as const,
      color: 'white',
      marginTop: '20px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>VIBRANT SMASH FITNESS</h1>
        <p style={styles.subtitle}>Move to Earn Power Gems!</p>
        
        {isConnected ? (
          <div style={styles.balanceBox}>
            Power Gems: {parseFloat(contractBalance).toFixed(2)} FYTS
            {chain?.id !== SEPOLIA_CHAIN_ID && (
              <div style={{color: 'red', marginTop: '5px', fontSize: '0.9rem'}}>Switch to Sepolia!</div>
            )}
          </div>
        ) : (
          <div style={{marginTop: '10px'}}>
            <WalletConnect />
          </div>
        )}
      </div>

      <div style={styles.mainCard}>
        <div style={styles.distanceDisplay}>
          {stats.distanceMeters.toFixed(0)}m
          {debugClicks > 0 && (
            <div style={{fontSize: '1rem', color: '#666'}}>
              (+{debugClicks * 100}m debug)
            </div>
          )}
        </div>
        
        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formattedStats.duration}</div>
            <div style={styles.statLabel}>Time</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formattedStats.pace}</div>
            <div style={styles.statLabel}>Pace</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formattedStats.currentSpeed}</div>
            <div style={styles.statLabel}>Speed</div>
          </div>
        </div>

        {state === 'idle' && (
          <button onClick={start} style={styles.startButton}>
            START POWER RUN!
          </button>
        )}
        
        {(state === 'running' || state === 'stationary') && (
          <div style={styles.buttonGroup}>
            <button onClick={pause} style={styles.actionButton}>PAUSE</button>
            <button onClick={handleRunEnd} style={{...styles.actionButton, 
              background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'}} 
              disabled={isSubmitting}>
              {isSubmitting ? 'SENDING...' : 'FINISH'}
            </button>
          </div>
        )}
        
        {state === 'paused' && (
          <div style={styles.buttonGroup}>
            <button onClick={resume} style={styles.actionButton}>RESUME</button>
            <button onClick={handleRunEnd} style={{...styles.actionButton,
              background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'}}>
              FINISH
            </button>
          </div>
        )}
        
        {state === 'ended' && (
          <div style={styles.completionCard}>
            <h2 style={{margin: '0 0 15px 0'}}>Power Run Complete!</h2>
            <p style={{fontSize: '1.2rem'}}>
              Distance: {stats.distanceMeters.toFixed(0)}m
            </p>
            {validationResult && (
              <div style={{marginTop: '15px', fontSize: '1.5rem', fontWeight: 'bold'}}>
                +{validationResult.tokens} FYTS earned!
              </div>
            )}
            {stats.distanceMeters < 100 && (
              <p style={{marginTop: '10px', color: '#ffeb3b'}}>
                Need 100m minimum to earn gems!
              </p>
            )}
            <button onClick={() => {
              discard();
              setValidationResult(null);
              setDebugClicks(0);
            }} style={{...styles.startButton, marginTop: '15px', padding: '15px 30px'}}>
              NEW RUN
            </button>
          </div>
        )}
      </div>

      {state === 'running' && (
        <button onClick={handleDebugClick} style={styles.debugButton}>
          +100m TEST
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
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