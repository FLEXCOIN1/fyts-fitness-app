import { useRunTracker } from './useRunTracker';
import './App.css';
import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { useAccount, useContractWrite, useContractRead } from 'wagmi';
import { parseEther } from 'viem';

// Add your deployed contract address and ABI here
const CONTRACT_ADDRESS = "0x..."; // TODO: Add your deployed contract address
const CONTRACT_ABI = [
  // TODO: Add your contract ABI from Remix here
  // This is a placeholder - replace with actual ABI
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
  },
  {
    "inputs": [{"internalType": "address", "name": "validator", "type": "address"}],
    "name": "approveValidator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "validationId", "type": "uint256"}],
    "name": "approveValidation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const OWNER_ADDRESS = "0x..."; // TODO: Add your owner address here

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

export default function App() {
  const { state, stats, formattedStats, start, pause, resume, end, discard } = useRunTracker();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { isConnected, address } = useAccount();
  
  // Admin panel state
  const [validatorAddress, setValidatorAddress] = useState('');
  const [validationId, setValidationId] = useState('');
  const [submittedValidationId, setSubmittedValidationId] = useState<string | null>(null);
  
  // Contract functions
  const { write: submitValidation } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'submitValidation',
  });
  
  const { write: approveValidator } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'approveValidator',
  });
  
  const { write: approveValidation } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'approveValidation',
  });
  
  const { data: userBalance } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address,
  });

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
    if (!isConnected || !submitValidation) {
      console.log('Wallet not connected or contract not loaded');
      return;
    }
    
    try {
      // Convert duration from milliseconds to seconds
      const durationSeconds = Math.floor(duration / 1000);
      
      // Create a simple proof URI (in production, upload actual GPS data to IPFS)
      const proofData = {
        timestamp: Date.now(),
        distance: Math.floor(distance),
        duration: durationSeconds,
        address: address
      };
      const proofURI = `data:${btoa(JSON.stringify(proofData))}`;
      
      console.log('Submitting validation to FYTS Protocol...');
      console.log(`Distance: ${Math.floor(distance)}m, Duration: ${durationSeconds}s`);
      
      // Submit to smart contract
      const result = await submitValidation({
        args: [BigInt(Math.floor(distance)), BigInt(durationSeconds), proofURI],
      });
      
      console.log('Transaction submitted:', result);
      setSubmittedValidationId('Pending approval');
      
    } catch (error) {
      console.error('Failed to submit validation:', error);
      alert('Failed to submit validation. Make sure you are an approved validator.');
    }
  };

  const handleRunEnd = () => {
    end();
    if (isConnected && stats.distanceMeters > 10) {
      submitNetworkValidation(stats.distanceMeters, stats.elapsedMs);
    }
  };
  
  const handleApproveValidator = async () => {
    if (!approveValidator || !validatorAddress) return;
    
    try {
      const result = await approveValidator({
        args: [validatorAddress as `0x${string}`],
      });
      console.log('Validator approval tx:', result);
      alert('Validator approved successfully!');
      setValidatorAddress('');
    } catch (error) {
      console.error('Failed to approve validator:', error);
      alert('Failed to approve validator');
    }
  };
  
  const handleApproveValidation = async () => {
    if (!approveValidation || !validationId) return;
    
    try {
      const result = await approveValidation({
        args: [BigInt(validationId)],
      });
      console.log('Validation approval tx:', result);
      alert('Validation approved successfully!');
      setValidationId('');
    } catch (error) {
      console.error('Failed to approve validation:', error);
      alert('Failed to approve validation');
    }
  };
  
  const formatBalance = (balance: any): string => {
    if (!balance) return '0';
    const balanceInEther = Number(balance) / 10**18;
    return balanceInEther.toFixed(2);
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
      
      {/* Display FYTS Balance if connected */}
      {isConnected && userBalance && (
        <div className="balance-display" style={{
          textAlign: 'center',
          padding: '1rem',
          color: '#10b981',
          fontSize: '1.25rem',
          fontWeight: 'bold'
        }}>
          Your FYTS Balance: {formatBalance(userBalance)} FYTS
        </div>
      )}
      
      {/* Admin Panel - Only visible to contract owner */}
      {isConnected && address === OWNER_ADDRESS && (
        <div className="admin-panel" style={{
          background: 'rgba(251, 191, 36, 0