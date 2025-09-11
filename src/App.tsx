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

  // Check contract balance when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchContractBalance();
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
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (chain?.id !== SEPOLIA_CHAIN_ID) {
      alert('Please switch to Sepolia testnet');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FYTSContract.abi, signer);
      
      // Check if user is approved validator
      const isApproved = await contract.approvedValidators(address);
      if (!isApproved) {
        alert('Your address is not an approved validator yet. Contact admin for approval.');
        setIsSubmitting(false);
        return;
      }
      
      // Create proof data
      const proofData = {
        distance: Math.floor(distance),
        duration: Math.floor(duration / 1000), // Convert to seconds
        timestamp: Date.now(),
        device: navigator.userAgent
      };
      
      const proofURI = `data:${JSON.stringify(proofData)}`;
      
      // Submit validation to contract
      console.log('Submitting validation:', proofData);
      const tx = await contract.submitValidation(
        Math.floor(distance),
        Math.floor(duration / 1000),
        proofURI
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Calculate approximate reward (matching contract logic)
      const baseReward = 0.1; // 0.1 FYTS base
      const distanceReward = (distance * 0.0001); // 0.0001 FYTS per meter
      const durationBonus = duration > 1800000 ? 0.5 : 0; // 0.5 FYTS for 30+ minutes
      const estimatedReward = baseReward + distanceReward + durationBonus;
      
      setValidationResult({
        success: true,
        userAllocation: Math.min(estimatedReward, 10), // Max 10 FYTS
        txHash: receipt.transactionHash
      });
      
      // Refresh balance
      await fetchContractBalance();
      
      console.log('Validation submitted to blockchain successfully');
    } catch (error: any) {
      console.error('Validation submission error:', error);
      if (error.message.includes('Daily limit reached')) {
        alert('You have reached your daily validation limit (10 per day)');
      } else if (error.message.includes('Speed too high')) {
        alert('Movement speed too high - possible GPS error');
      } else {
        alert(`Error submitting validation: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunEnd = () => {
    end();
    if (isConnected && stats.distanceMeters > 100) { // Min 100m for validation
      submitNetworkValidation(stats.distanceMeters, stats.elapsedMs);
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
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem 1rem', 
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
              Balance: {parseFloat(contractBalance).toFixed(4)} FYTS
            </span>
            {chain?.id !== SEPOLIA_CHAIN_ID && (
              <span style={{ color: '#ef4444', marginLeft: '1rem' }}>
                ⚠️ Switch to Sepolia Testnet
              </span>
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
              onClick={() => addDistance(100)}
              style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                zIndex: 9999,
                cursor: 'pointer'
              }}
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
                    {validationResult ? 'Data submitted to blockchain' : 'Ready for next validation'}
                  </p>
                  <div className="completion-stats">
                    <div className="completion-distance">{formatDistanceWithBoth(stats.distanceMeters)}</div>
                    <div className="completion-label">Distance Validated</div>
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
                        +{validationResult.userAllocation.toFixed(4)} FYTS (Pending)
                      </div>
                      <div style={{ color: '#6ee7b7', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Awaiting admin approval
                      </div>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${validationResult.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}
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
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#10b981', marginBottom: '2rem' }}>Protocol Documentation</h2>
          
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h3 style={{ color: '#60a5fa', margin: '0 0 1rem 0' }}>Blockchain Integration Active</h3>
            <p style={{ color: '#bfdbfe', fontSize: '1rem' }}>
              Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </p>
            <p style={{ color: '#bfdbfe', fontSize: '1rem', marginTop: '0.5rem' }}>
              Network: Sepolia Testnet
            </p>
            <p style={{ color: '#bfdbfe', fontSize: '1rem', marginTop: '0.5rem' }}>
              Status: {isConnected ? '🟢 Connected' : '🔴 Not Connected'}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>How It Works</h3>
            
            <div style={{ 
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.75rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ color: '#f97316', margin: '0 0 0.5rem 0' }}>1. Connect Wallet</h4>
              <p style={{ color: '#d1d5db', margin: 0 }}>
                Connect MetaMask or WalletConnect to Sepolia testnet
              </p>
            </div>

            <div style={{ 
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.75rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ color: '#f97316', margin: '0 0 0.5rem 0' }}>2. Start Validation</h4>
              <p style={{ color: '#d1d5db', margin: 0 }}>
                GPS tracks your movement. Minimum 100m required. Use +100m button if GPS fails.
              </p>
            </div>

            <div style={{ 
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.75rem'
            }}>
              <h4 style={{ color: '#f97316', margin: '0 0 0.5rem 0' }}>3. Earn FYTS</h4>
              <p style={{ color: '#d1d5db', margin: 0 }}>
                Base: 0.1 FYTS + 0.0001 FYTS/meter + bonuses. Max 10 FYTS per validation.
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <p style={{ color: '#fca5a5', margin: 0, fontWeight: 600 }}>
              ⚠️ Testnet Only - Tokens have no real value
            </p>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#10b981', marginBottom: '2rem' }}>Protocol Support</h2>
          
          {!contactSubmitted ? (
            <form onSubmit={handleContactSubmit} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Validator Username
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.username}
                  onChange={(e) => setContactForm({...contactForm, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Validator Name
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({...contactForm, firstName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Contact Address
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Support Query Details
                </label>
                <textarea
                  required
                  rows={5}
                  value={contactForm.details}
                  onChange={(e) => setContactForm({...contactForm, details: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '1rem',
                    resize: 'vertical',
                    minHeight: '120px'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Submit Protocol Inquiry
              </button>
            </form>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
              <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Inquiry Received</h3>
              <p style={{ color: '#6ee7b7' }}>Protocol support will respond within 24-48 hours</p>
            </div>
          )}

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '0.75rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
              For immediate technical support, consult the protocol documentation
            </p>
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