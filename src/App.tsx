import { useRunTracker } from './useRunTracker';
import './App.css';
import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { useAccount, WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'viem/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { allocationSystem } from './utils/mockAllocationSystem';
import LegalDisclaimer from './components/LegalDisclaimer';

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
  "Your participation strengthens the network.",
  "Every step validates the protocol.",
  "Contributing to decentralized fitness validation.",
  "Your movement data improves the ecosystem.",
  "Network consensus through physical activity.",
  "Validating blocks, one step at a time.",
  "Distributed fitness verification in progress.",
  "Your contribution matters to the protocol.",
  "Consensus achieved through movement.",
  "Building the future of fitness validation.",
];

function AppContent() {
  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const { state, stats, formattedStats, start, pause, resume, end, discard } = useRunTracker();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { isConnected, address } = useAccount();
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    userEarning: number;
    ownerEarning: number;
    txHash: string;
  } | null>(null);
  
  // Terms acceptance state - CHECK AND CLEAR for testing
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
  
  // Check localStorage for terms acceptance AFTER all hooks
  useEffect(() => {
    // UNCOMMENT THIS TO RESET TERMS FOR TESTING:
    localStorage.removeItem('fyts_terms_accepted');
    
    const accepted = localStorage.getItem('fyts_terms_accepted') === 'true';
    setTermsAccepted(accepted);
  }, []);

  // Quote rotation effect
  useEffect(() => {
    let interval: number | null = null;
    if (state === 'running' || state === 'stationary') {
      interval = setInterval(() => {
        setCurrentQuoteIndex((prevIndex) => 
          (prevIndex + 1) % motivationalQuotes.length
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
      console.log('Wallet connection required for validation submission');
      return;
    }
    
    try {
      const result = await AllocationSystem.submitRun(address, distance, duration);
      
      if (result.validated) {
        setValidationResult({
          success: true,
          userEarning: result.userEarning,
          ownerEarning: result.ownerEarning,
          txHash: result.transactionHash
        });
        
        console.log('Validation submitted to protocol');
      }
    } catch (error) {
      console.error('Validation submission error:', error);
    }
  };

  const handleRunEnd = () => {
    end();
    if (isConnected && stats.distanceMeters > 10) {
      submitNetworkValidation(stats.distanceMeters, stats.elapsedMs);
    }
  };

  const handleAcceptTerms = () => {
    localStorage.setItem('fyts_terms_accepted', 'true');
    setTermsAccepted(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
    setContactSubmitted(true);
    // Reset form after 3 seconds
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

  // CONDITIONAL RETURN AFTER ALL HOOKS
  if (!termsAccepted) {
    return <LegalDisclaimer onAccept={handleAcceptTerms} />;
  }

  // Main app interface
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

      {/* Navigation */}
      <div className="main-navigation">
        <button 
          className={activeTab === 'tracker' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('tracker')}
        >
          🏃 Tracker
        </button>
        <button 
          className={activeTab === 'staking' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('staking')}
        >
          💎 Staking
        </button>
        <button 
          className={activeTab === 'leaderboards' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('leaderboards')}
        >
          🏆 Leaderboards
        </button>
        <button 
          className={activeTab === 'tutorial' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('tutorial')}
        >
          📚 How To
        </button>
        <button 
          className={activeTab === 'contact' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('contact')}
        >
          📧 Contact
        </button>
      </div>

      <WalletConnect />

      {/* Tracker Tab */}
      {activeTab === 'tracker' && (
        <>
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
                <span>GPS Active</span>
              </div>
            </div>
            {state === 'stationary' && (
              <div className="stationary-notice">
                Movement required for validation
              </div>
            )}
          </div>

          <div className="distance-container">
            <div className="distance-value">
              {formatDistanceWithBoth(stats.distanceMeters)}
            </div>
            <div className="distance-label">Distance Tracked</div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value blue">{formattedStats.duration}</div>
              <div className="stat-label">Duration</div>
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
              <button onClick={start} className="start-button">
                <div className="button-icon">▶</div>
                <div className="button-text">START</div>
                <div className="button-subtitle">Begin validation</div>
              </button>
            )}
            
            {(state === 'running' || state === 'stationary') && (
              <div className="button-group">
                <button onClick={pause} className="action-button pause">⏸</button>
                <button onClick={handleRunEnd} className="action-button stop">⏹</button>
              </div>
            )}
            
            {state === 'paused' && (
              <div className="button-group">
                <button onClick={resume} className="action-button resume">▶</button>
                <button onClick={handleRunEnd} className="action-button stop">⏹</button>
              </div>
            )}
            
            {state === 'ended' && (
              <div className="completion-container">
                <div className="completion-card">
                  <div className="completion-emoji">✓</div>
                  <h2 className="completion-title">Validation Complete</h2>
                  <p className="completion-subtitle">Thank you for your participation in the protocol</p>
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
                        +{validationResult.userEarning.toFixed(4)} FYTS
                      </div>
                      <div style={{ color: '#6ee7b7', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Tokens allocated to wallet
                      </div>
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
                  <div className="button-text">NEW SESSION</div>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Staking Tab */}
      {activeTab === 'staking' && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#10b981' }}>Staking Protocol</h2>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Commitment-based validation rewards</p>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <p style={{ color: '#fbbf24' }}>Feature activating soon</p>
            <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginTop: '1rem' }}>
              Stake FYTS tokens to commit to weekly fitness validation goals. 
              Successful completion results in additional token allocation.
            </p>
          </div>
        </div>
      )}

      {/* Leaderboards Tab */}
      {activeTab === 'leaderboards' && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#10b981' }}>Network Rankings</h2>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Top validators in the protocol</p>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <p style={{ color: '#fbbf24' }}>Feature activating soon</p>
            <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginTop: '1rem' }}>
              View top validators by distance, consistency, and speed metrics. 
              Rankings update in real-time as validation data is submitted.
            </p>
          </div>
        </div>
      )}

      {/* Tutorial Tab */}
      {activeTab === 'tutorial' && (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#10b981', marginBottom: '2rem' }}>Protocol Participation Guide</h2>
          
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h3 style={{ color: '#60a5fa', margin: '0 0 1rem 0' }}>It's Simple!</h3>
            <p style={{ color: '#bfdbfe', fontSize: '1.125rem' }}>
              Just three steps to participate in the movement validation protocol:
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.75rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>1</div>
              <div>
                <h3 style={{ color: '#10b981', margin: '0 0 0.25rem 0' }}>Connect Wallet</h3>
                <p style={{ color: '#d1d5db', margin: 0 }}>
                  Link your Web3 wallet to begin participation. Your wallet address serves as your validator identity.
                </p>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.75rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>2</div>
              <div>
                <h3 style={{ color: '#f97316', margin: '0 0 0.25rem 0' }}>Press START</h3>
                <p style={{ color: '#d1d5db', margin: 0 }}>
                  Initiate validation session. GPS tracking begins automatically. Move to generate validation data.
                </p>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.75rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>3</div>
              <div>
                <h3 style={{ color: '#a78bfa', margin: '0 0 0.25rem 0' }}>Earn Tokens</h3>
                <p style={{ color: '#d1d5db', margin: 0 }}>
                  Complete validation to receive FYTS token allocation. Thank you for your participation in the protocol.
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6ee7b7', margin: 0, fontWeight: 600 }}>
              That's it! Your movement validates the network.
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
                  Username
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
                  First Name
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
                  Email Address
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
                  Details
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
                Submit Inquiry
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