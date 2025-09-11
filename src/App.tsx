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

// Contract configuration
const CONTRACT_ADDRESS = '0x2955128a2ef2c7038381a5F56bcC21A91889595B';
const SEPOLIA_CHAIN_ID = 11155111;

// Create the wagmi configuration
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

const protocolMessages = [
  "Validation sequence in progress...",
  "Contributing to network consensus...",
  "Movement data processing...",
  "Protocol synchronization active...",
  "Distributed validation confirmed...",
  "Network participation acknowledged...",
  "Consensus mechanism engaged...",
  "Validation metrics recording...",
  "Protocol integrity maintained...",
  "Decentralized verification active...",
];

function AppContent() {
  const { state, stats, formattedStats, start, pause, resume, end, discard, addDistance } = useRunTracker();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { isConnected, address, chain } = useAccount();
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    userAllocation: number;
    txHash: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractBalance, setContractBalance] = useState('0');
  const [pendingValidations, setPendingValidations] = useState<any[]>([]);
  
  // Terms acceptance state
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<'tracker' | 'staking' | 'leaderboards' | 'tutorial' | 'contact'>('tracker');
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    username: '',
    firstName: '',
    email: '',
    details: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  
  // Check localStorage for terms acceptance
  useEffect(() => {
    const accepted = localStorage.getItem('fyts_terms_accepted') === 'true';
    setTermsAccepted(accepted);
  }, []);

  // Check contract balance and pending validations when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchContractBalance();
      checkPendingValidations();
    }
  }, [isConnected, address]);

  const fetchContractBalance = async () => {
    if (!window.ethereum || !address) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FYTSContract.abi, provider);
      const balance = await contract.balanceOf(address);
      setContractBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const checkPendingValidations = async () => {
    if (!window.ethereum || !address) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FYTSContract.abi, provider);
      const pending = await contract.getPendingValidations();
      setPendingValidations(pending);
      console.log('Pending validations:', pending.length);
    } catch (error) {
      console.error('Error checking pending validations:', error);
    }
  };

  // Quote rotation effect
  useEffect(() => {
    let interval: number | null = null;
    if (state === 'running' || state === 'stationary') {
      interval = setInterval(() => {
        setCurrentQuoteIndex((prevIndex) => 
          (prevIndex + 1) % protocolMessages.length
        );
      }, 15000);
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
    console.log('Starting validation submission...');
    console.log('Distance:', distance, 'Duration:', duration);
    console.log('Connected:', isConnected, 'Address:', address, 'Chain:', chain?.id);
    
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (chain?.id !== SEPOLIA_CHAIN_ID) {
      alert(`Wrong network! Please switch to Sepolia. Current chain: ${chain?.id}`);
      return;
    }

    if (distance < 100) {
      alert(`Distance too short: ${distance.toFixed(2)}m. Minimum 100m required.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      alert('Submitting validation to blockchain... This may take 30 seconds.');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FYTSContract.abi, signer);
      
      // Check approval status
      const isApproved = await contract.approvedValidators(address);
      console.log('Is approved validator:', isApproved);
      
      if (!isApproved) {
        alert('Your address is not an approved validator. You are already approved, so this should not happen. Check console for details.');
        console.error('Approval check failed for address:', address);
        setIsSubmitting(false);
        return;
      }
      
      // Create proof data
      const proofData = {
        distance: Math.floor(distance),
        duration: Math.floor(duration / 1000),
        timestamp: Date.now(),
        device: navigator.userAgent
      };
      
      const proofURI = `data:${JSON.stringify(proofData)}`;
      
      // Submit validation to contract
      console.log('Submitting with params:', {
        distance: Math.floor(distance),
        duration: Math.floor(duration / 1000),
        proofURI
      });
      
      const tx = await contract.submitValidation(
        Math.floor(distance),
        Math.floor(duration / 1000),
        proofURI
      );
      
      alert(`Transaction sent! Hash: ${tx.hash.slice(0,10)}...`);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Get the validation ID from events
      const validationId = receipt.events?.find((e: any) => e.event === 'ValidationSubmitted')?.args?.validationId;
      
      alert(`Validation submitted successfully! ID: ${validationId || 'pending'}. Admin approval required for token distribution.`);
      
      // Calculate approximate reward
      const baseReward = 0.1;
      const distanceReward = (distance * 0.0001);
      const durationBonus = duration > 1800000 ? 0.5 : 0;
      const estimatedReward = baseReward + distanceReward + durationBonus;
      
      setValidationResult({
        success: true,
        userAllocation: Math.min(estimatedReward, 10),
        txHash: receipt.transactionHash
      });
      
      // Refresh balance and pending validations
      await fetchContractBalance();
      await checkPendingValidations();
      
    } catch (error: any) {
      console.error('Full error:', error);
      
      if (error.message.includes('Daily limit reached')) {
        alert('You have reached your daily validation limit (10 per day)');
      } else if (error.message.includes('Speed too high')) {
        alert('Movement speed too high - possible GPS error');
      } else if (error.message.includes('user rejected')) {
        alert('Transaction cancelled by user');
      } else {
        alert(`Error: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunEnd = () => {
    end();
    
    // Log final stats
    console.log('Run ended with stats:', {
      distance: stats.distanceMeters,
      duration: stats.elapsedMs,
      connected: isConnected,
      address: address
    });
    
    // Check if we should submit
    if (stats.distanceMeters >= 100) {
      if (isConnected && address) {
        submitNetworkValidation(stats.distanceMeters, stats.elapsedMs);
      } else {
        alert('Connect wallet to submit validation and earn FYTS tokens');
      }
    } else {
      console.log('Distance too short for validation:', stats.distanceMeters);
    }
  };

  const handleAcceptTerms = () => {
    localStorage.setItem('fyts_terms_accepted', 'true');
    setTermsAccepted(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Protocol inquiry submitted:', contactForm);
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({
        username: '',
        firstName: '',
        email: '',
        details: ''
      });
    }, 3000);
  };

  if (!termsAccepted) {
    return <LegalDisclaimer onAccept={handleAcceptTerms} />;
  }

  return (
    <div className="app-container">
      <div className="background-gradient"></div>
      
      <div className="header">
        <div className="logo-container">
          <div className="logo">F</div>
        </div>
        <h1 className="app-title">FYTS FITNESS</h1>
        <p className="protocol-subtitle">Movement Validation Protocol</p>
        {isConnected && (
          <div className="balance-display">
            <span className="balance-label">Balance:</span>
            <span className="balance-value">{parseFloat(contractBalance).toFixed(4)} FYTS</span>
            {pendingValidations.length > 0 && (
              <span className="pending-badge">{pendingValidations.length} pending</span>
            )}
            {chain?.id !== SEPOLIA_CHAIN_ID && (
              <span className="network-warning">⚠️ Switch to Sepolia</span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="main-navigation">
        <button 
          className={activeTab === 'tracker' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('tracker')}
        >
          🔄 Validator
        </button>
        <button 
          className={activeTab === 'staking' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('staking')}
        >
          🔒 Staking
        </button>
        <button 
          className={activeTab === 'leaderboards' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('leaderboards')}
        >
          📊 Rankings
        </button>
        <button 
          className={activeTab === 'tutorial' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('tutorial')}
        >
          📖 Protocol
        </button>
        <button 
          className={activeTab === 'contact' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('contact')}
        >
          🔧 Support
        </button>
      </div>

      <WalletConnect />

      {/* Tracker Tab */}
      {activeTab === 'tracker' && (
        <>
          {(state === 'running' || state === 'stationary') && (
            <div className="motivation-container">
              <div className="motivation-quote">
                {protocolMessages[currentQuoteIndex]}
              </div>
            </div>
          )}

          <div className="status-container">
            <div className="status-card">
              <div className="status-indicator">
                <div className={`status-dot ${state}`}></div>
                <span className="status-text">
                  {state === 'stationary' ? 'Awaiting Movement' : 
                   state === 'running' ? 'Validating' :
                   state === 'paused' ? 'Suspended' :
                   state === 'ended' ? 'Finalized' :
                   state === 'idle' ? 'Ready' :
                   String(state).charAt(0).toUpperCase() + String(state).slice(1)}
                </span>
              </div>
              <div className="gps-indicator">
                <div className="gps-dots">
                  <div className="gps-dot"></div>
                  <div className="gps-dot"></div>
                  <div className="gps-dot"></div>
                </div>
                <span>GPS Active</span>
              </div>
            </div>
            {state === 'stationary' && (
              <div className="stationary-notice">
                Movement required for validation sequence
              </div>
            )}
          </div>

          {/* Debug Button for Mobile Testing */}
          {state === 'running' && (
            <button 
              onClick={(e) => {
                addDistance(100);
                const btn = e.currentTarget;
                btn.style.background = '#10b981';
                btn.textContent = '✓ Added!';
                setTimeout(() => {
                  btn.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
                  btn.textContent = '+100m (Debug)';
                }, 1000);
              }}
              className="debug-button"
            >
              +100m (Debug)
            </button>
          )}

          <div className="distance-container">
            <div className="distance-value">
              {formatDistanceWithBoth(stats.distanceMeters)}
            </div>
            <div className="distance-label">Distance Validated</div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value blue">{formattedStats.duration}</div>
              <div className="stat-label">Duration</div>
            </div>
            <div className="stat-card">
              <div className="stat-value purple">{formattedStats.pace}</div>
              <div className="stat-label">Pace Metric</div>
            </div>
            <div className="stat-card">
              <div className="stat-value orange">{formattedStats.currentSpeed}</div>
              <div className="stat-label">Velocity</div>
            </div>
          </div>

          <div className="action-container">
            {state === 'idle' && (
              <button onClick={start} className="start-button">
                <div className="button-icon">▶</div>
                <div className="button-text">INITIATE</div>
                <div className="button-subtitle">Begin validation sequence</div>
              </button>
            )}
            
            {(state === 'running' || state === 'stationary') && (
              <div className="button-group">
                <button onClick={pause} className="action-button pause">⏸</button>
                <button onClick={handleRunEnd} className="action-button stop" disabled={isSubmitting}>
                  {isSubmitting ? '⏳' : '⏹'}
                </button>
              </div>
            )}
            
            {state === 'paused' && (
              <div className="button-group">
                <button onClick={resume} className="action-button resume">▶</button>
                <button onClick={handleRunEnd} className="action-button stop" disabled={isSubmitting}>⏹</button>
              </div>
            )}
            
            {state === 'ended' && (
              <div className="completion-container">
                <div className="completion-card">
                  <div className="completion-emoji">✓</div>
                  <h2 className="completion-title">Validation Sequence Complete</h2>
                  <p className="completion-subtitle">
                    {validationResult ? 'Data submitted to blockchain' : 
                     stats.distanceMeters < 100 ? 'Distance too short (min 100m)' :
                     !isConnected ? 'Connect wallet to submit' :
                     'Ready for submission'}
                  </p>
                  <div className="completion-stats">
                    <div className="completion-distance">{formatDistanceWithBoth(stats.distanceMeters)}</div>
                    <div className="completion-label">Distance Validated</div>
                  </div>
                  
                  {validationResult && validationResult.success && (
                    <div className="validation-result">
                      <div className="result-amount">
                        +{validationResult.userAllocation.toFixed(4)} FYTS (Pending)
                      </div>
                      <div className="result-status">
                        Awaiting admin approval
                      </div>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${validationResult.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="result-link"
                      >
                        View on Etherscan →
                      </a>
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
                  <div className="button-icon">+</div>
                  <div className="button-text">NEW VALIDATION</div>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Staking Tab */}
      {activeTab === 'staking' && <StakingDashboard />}

      {/* Leaderboards Tab */}
      {activeTab === 'leaderboards' && <LeaderboardsDashboard />}

      {/* Tutorial Tab */}
      {activeTab === 'tutorial' && (
        <div className="tutorial-container">
          <h2 className="section-title">Protocol Documentation</h2>
          
          <div className="info-card primary">
            <h3>Blockchain Integration Active</h3>
            <p>Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</p>
            <p>Network: Sepolia Testnet</p>
            <p>Status: {isConnected ? '🟢 Connected' : '🔴 Not Connected'}</p>
          </div>

          <div className="steps-container">
            <h3>How It Works</h3>
            
            <div className="step-card">
              <h4>1. Connect Wallet</h4>
              <p>Connect MetaMask or WalletConnect to Sepolia testnet</p>
            </div>

            <div className="step-card">
              <h4>2. Start Validation</h4>
              <p>GPS tracks movement. Min 100m. Use +100m button if GPS fails.</p>
            </div>

            <div className="step-card">
              <h4>3. Earn FYTS</h4>
              <p>Base: 0.1 FYTS + 0.0001 FYTS/meter + bonuses. Max 10 FYTS per validation.</p>
            </div>
          </div>

          <div className="warning-card">
            <p>⚠️ Testnet Only - Tokens have no real value</p>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="contact-container">
          <h2 className="section-title">Protocol Support</h2>
          
          {!contactSubmitted ? (
            <form onSubmit={handleContactSubmit} className="contact-form">
              <div className="form-group">
                <label>Validator Username</label>
                <input
                  type="text"
                  required
                  value={contactForm.username}
                  onChange={(e) => setContactForm({...contactForm, username: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Validator Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({...contactForm, firstName: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Support Query Details</label>
                <textarea
                  required
                  rows={5}
                  value={contactForm.details}
                  onChange={(e) => setContactForm({...contactForm, details: e.target.value})}
                  className="form-textarea"
                />
              </div>

              <button type="submit" className="submit-button">
                Submit Protocol Inquiry
              </button>
            </form>
          ) : (
            <div className="success-card">
              <div className="success-icon">✓</div>
              <h3>Inquiry Received</h3>
              <p>Protocol support will respond within 24-48 hours</p>
            </div>
          )}

          <div className="info-note">
            <p>For immediate technical support, consult the protocol documentation</p>
          </div>
        </div>
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