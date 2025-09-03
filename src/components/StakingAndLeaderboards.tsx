import { useRunTracker } from './useRunTracker';
import './App.css';
import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { useAccount, WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'viem/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { earningSystem } from './utils/mockEarningSystem';
import LegalDisclaimer from './components/LegalDisclaimer';
import StakingAndLeaderboards from './components/StakingAndLeaderboards';

// Create the wagmi configuration
const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({ 
      projectId: '794e2b891a07a5da78b220c48523541e'
    }),
    coinbaseWallet({
      appName: 'FytS Fitness',
    }),
  ],
});

const queryClient = new QueryClient();

const motivationalQuotes = [
  "Push yourself because no one else is going to do it for you.",
  // ... rest of your quotes
];

function AppContent() {
  const { state, stats, formattedStats, start, pause, resume, end, discard } = useRunTracker();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { isConnected, address } = useAccount();
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    userEarning: number;
    ownerEarning: number;
    txHash: string;
  } | null>(null);
  
  // Check if user has accepted terms
  const [termsAccepted, setTermsAccepted] = useState(
    localStorage.getItem('fyts_terms_accepted') === 'true'
  );
  
  // Navigation state for dashboard
  const [currentView, setCurrentView] = useState<'tracker' | 'dashboard'>('tracker');

  // SHOW LEGAL DISCLAIMER FIRST
  if (!termsAccepted) {
    return <LegalDisclaimer onAccept={() => {
      localStorage.setItem('fyts_terms_accepted', 'true');
      setTermsAccepted(true);
      window.location.reload(); // Force reload to ensure state updates
    }} />;
  }

  useEffect(() => {
    let interval: number | null = null;
    if (state === 'running' || state === 'stationary') {
      interval = setInterval(() => {
        setCurrentQuoteIndex((prevIndex) => 
          (prevIndex + 1) % motivationalQuotes.length
        );
      }, 20000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const formatDistanceWithBoth = (meters: number): string => {
    const km = (meters / 1000).toFixed(2);
    const miles = (meters * 0.000621371).toFixed(2);
    
    if (meters >= 1000) {
      return `${km} km (${miles} mi)`;
    }
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft (${(feet * 0.000189394).toFixed(3)} mi)`;
  };

  const submitNetworkValidation = async (distance: number, duration: number) => {
    if (!isConnected || !address) {
      console.log('Wallet not connected - cannot submit validation data');
      return;
    }
    
    try {
      const result = await earningSystem.submitRun(
        address,
        distance,
        duration
      );
      
      if (result.validated) {
        setValidationResult({
          success: true,
          userEarning: result.userEarning,
          ownerEarning: result.ownerEarning,
          txHash: result.transactionHash
        });
        
        const userStats = earningSystem.getUserStats(address);
        const ownerStats = earningSystem.getOwnerEarnings();
        
        console.log('📈 User Stats:', userStats);
        console.log('💰 Owner Stats:', ownerStats);
      } else {
        console.log('❌ Run validation failed');
      }
    } catch (error) {
      console.error('Error submitting validation:', error);
    }
  };

  const handleRunEnd = () => {
    end();
    if (isConnected && stats.distanceMeters > 10) {
      submitNetworkValidation(stats.distanceMeters, stats.elapsedMs);
    }
  };

  // Show dashboard if selected
  if (currentView === 'dashboard') {
    return (
      <div className="app-container">
        <div className="background-gradient"></div>
        
        {/* Navigation Header */}
        <div className="nav-header">
          <button 
            onClick={() => setCurrentView('tracker')}
            className="nav-button"
          >
            ← Back to Tracker
          </button>
          <h1 className="app-title">FYTS FITNESS</h1>
          <div className="wallet-status">
            {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not Connected'}
          </div>
        </div>
        
        <StakingAndLeaderboards />
      </div>
    );
  }

  // Main tracker view
  return (
    <div className="app-container">
      <div className="background-gradient"></div>
      
      <div className="header">
        <div className="logo-container">
          <div className="logo">F</div>
        </div>
        <h1 className="app-title">FYTS FITNESS</h1>
        <p className="protocol-subtitle">Movement Validation Protocol</p>
      </div>

      {/* Dashboard Navigation Button */}
      <div className="dashboard-nav">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="dashboard-button"
        >
          🏆 View Dashboard & Staking
        </button>
      </div>

      <WalletConnect />

      {(state === 'running' || state === 'stationary') && (
        <div className="motivation-container">
          <div className="motivation-quote">
            "{motivationalQuotes[currentQuoteIndex]}"
          </div>
        </div>
      )}

      <div className="status-container">
        <div className="status-card">
          <div className="status-indicator">
            <div className={`status-dot ${state}`}></div>
            <span className="status-text">
              {state === 'stationary' ? 'Stationary' : state.charAt(0).toUpperCase() + state.slice(1)}
            </span>
          </div>
          <div className="gps-indicator">
            <div className="gps-dots">
              <div className="gps-dot"></div>
              <div className="gps-dot"></div>
              <div className="gps-dot"></div>
            </div>
            <span>GPS</span>
          </div>
        </div>
        {state === 'stationary' && (
          <div className="stationary-notice">
            Move to resume active tracking
          </div>
        )}
      </div>

      <div className="distance-container">
        <div className="distance-value">
          {formatDistanceWithBoth(stats.distanceMeters)}
        </div>
        <div className="distance-label">Distance</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value blue">{formattedStats.duration}</div>
          <div className="stat-label">Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value purple">{formattedStats.pace}</div>
          <div className="stat-label">Pace</div>
        </div>
        <div className="stat-card">
          <div className="stat-value orange">{formattedStats.currentSpeed}</div>
          <div className="stat-label">Speed</div>
        </div>
      </div>

      <div className="action-container">
        {state === 'idle' && (
          <button 
            onClick={start}
            className="start-button"
          >
            <div className="button-icon">▶</div>
            <div className="button-text">START</div>
            <div className="button-subtitle">Begin data validation</div>
          </button>
        )}
        
        {(state === 'running' || state === 'stationary') && (
          <div className="button-group">
            <button 
              onClick={pause}
              className="action-button pause"
            >
              ⏸
            </button>
            <button 
              onClick={handleRunEnd}
              className="action-button stop"
            >
              ⏹
            </button>
          </div>
        )}
        
        {state === 'paused' && (
          <div className="button-group">
            <button 
              onClick={resume}
              className="action-button resume"
            >
              ▶
            </button>
            <button 
              onClick={handleRunEnd}
              className="action-button stop"
            >
              ⏹
            </button>
          </div>
        )}
        
        {state === 'ended' && (
          <div className="completion-container">
            <div className="completion-card">
              <div className="completion-emoji">🔗</div>
              <h2 className="completion-title">Network Validation Complete!</h2>
              <p className="completion-subtitle">Data contributed to FytS Protocol</p>
              <div className="completion-stats">
                <div className="completion-distance">{formatDistanceWithBoth(stats.distanceMeters)}</div>
                <div className="completion-label">Total Distance</div>
              </div>
              
              {validationResult && validationResult.success && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    +{validationResult.userEarning.toFixed(4)} FYTS
                  </div>
                  <div style={{ color: '#6ee7b7', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Earnings added to your balance
                  </div>
                  {address?.toLowerCase() === '0xcc1bb5fe5cf57eeee54792445586d3379e287d47' && (
                    <div style={{ color: '#fbbf24', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      Protocol fee earned: {validationResult.ownerEarning.toFixed(4)} FYTS
                    </div>
                  )}
                </div>
              )}
              
              {isConnected && (
                <div className="network-contribution">
                  <p className="network-text">Movement data submitted to validation network</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                discard();
                setValidationResult(null);
              }}
              className="new-run-button"
            >
              <div className="button-icon">★</div>
              <div className="button-text">NEW SESSION</div>
            </button>
          </div>
        )}
      </div>
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