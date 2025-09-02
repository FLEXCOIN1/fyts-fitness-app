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
  "Great things never come from comfort zones.",
  "Don't stop when you're tired. Stop when you're done.",
  "Success starts with self-discipline.",
  "A one hour workout is 4% of your day. No excuses.",
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Champions train, losers complain.",
  "Pain is weakness leaving the body.",
  "The groundwork for all happiness is good health.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "You don't have to be extreme, just consistent.",
  "Strong people are harder to kill and more useful in general.",
  "The successful warrior is the average person with laser-like focus.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your limitation—it's only your imagination.",
  "Sometimes later becomes never. Do it now.",
  "Don't wish for it. Work for it.",
  "Dream bigger. Do bigger.",
  "Prove them wrong.",
  "Make yourself proud.",
  "Strive for progress, not perfection.",
  "A healthy outside starts from the inside.",
  "Take care of your body. It's the only place you have to live.",
  "What seems impossible today will one day become your warm-up.",
  "The only person you are destined to become is the person you decide to be.",
  "It's going to be a journey. It's not a sprint to get in shape.",
  "Take it day by day and focus on you.",
  "If you want something you've never had, you must be willing to do something you've never done.",
  "The body achieves what the mind believes.",
  "Sweat is just fat crying.",
  "You are stronger than you think.",
  "Every mile begins with a single step.",
  "Run when you have to, walk if you have to, crawl if you have to; just never give up.",
  "The miracle isn't that I finished. The miracle is that I had the courage to start.",
  "Running is nothing more than a series of arguments between the part of your brain that wants to stop and the part that wants to keep going.",
  "If you run, you are a runner. It doesn't matter how fast or how far.",
  "The obsession with running is really an obsession with the potential for more and more life.",
  "Run often. Run long. But never outrun your joy of running.",
  "Ask yourself: 'Can I give more?' The answer is usually: 'Yes.'",
  "It is during our darkest moments that we must focus to see the light.",
  "Believe you can and you're halfway there.",
  "The difference between ordinary and extraordinary is that little extra.",
  "You're not going to master the rest of your life in one day. Just relax, master the day.",
  "Don't limit your challenges, challenge your limits.",
  "The cave you fear to enter holds the treasure you seek."
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
      // Use the mock earning system for testing
      const result = await earningSystem.submitRun(
        address,
        distance,
        duration
      );
      
      if (result.validated) {
        // Show success message
        setValidationResult({
          success: true,
          userEarning: result.userEarning,
          ownerEarning: result.ownerEarning,
          txHash: result.transactionHash
        });
        
        // Get updated stats
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
              
              {/* Show earnings if validation was successful */}
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