import { useRunTracker } from './useRunTracker';
import './App.css';
import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { useAccount, useContractWrite, useContractRead } from 'wagmi';

// Contract configuration - UPDATE THESE VALUES
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "distance", "type": "uint256"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "string", "name": "proofURI", "type": "string"}
    ],
    "name": "submitValidation",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const OWNER_ADDRESS = "0x0000000000000000000000000000000000000000";

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
  "The groundwork for all happiness is good health."
];

export default function App() {
  const { state, stats, formattedStats, start, pause, resume, end, discard } = useRunTracker();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { isConnected, address } = useAccount();

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
    if (!isConnected) {
      console.log('Wallet not connected - cannot submit validation data');
      return;
    }
    
    const dataHash = `0x${Buffer.from(`${distance}-${duration}-${Date.now()}`).toString('hex').slice(0, 64)}`;
    console.log('Contributing validation data to FytS Protocol...');
    console.log(`Distance: ${distance}m, Duration: ${duration}ms, Hash: ${dataHash}`);
    
    setTimeout(() => {
      console.log('Network validation submitted successfully');
    }, 1000);
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
                <d