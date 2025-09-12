import React, { useState, useEffect, useRef, useCallback } from 'react';

// Contract ABI for your deployed contract
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
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
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "approvedValidators",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "validator", "type": "address"}],
    "name": "approveValidator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = '0x2955128a2ef2c7038381a5F56bcC21A91889595B';
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = '0xaa36a7';

// CONVERSION RATE: Base reward is 10 FYTS + (distance/100) FYTS
// So approximately: 100m = 11 FYTS, 1000m = 20 FYTS, 5000m = 60 FYTS
const calculateExpectedFYTS = (distanceMeters) => {
  const baseReward = 10;
  const distanceReward = distanceMeters / 100;
  return baseReward + distanceReward;
};

export default function App() {
  // GPS & Run State
  const [runState, setRunState] = useState('idle');
  const [distance, setDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('Ready');
  const [gpsAccuracy, setGpsAccuracy] = useState(0);
  
  // Wallet State
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isValidator, setIsValidator] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  
  // Refs for tracking
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const positionCount = useRef(0);

  // Web3 Helper Functions
  const toHex = (num) => '0x' + num.toString(16);
  
  const fromWei = (wei) => {
    const weiString = wei.toString();
    if (weiString === '0x0' || weiString === '0') return '0.0';
    
    // Remove 0x prefix if present
    const cleanWei = weiString.startsWith('0x') ? weiString.slice(2) : weiString;
    const weiNum = BigInt('0x' + cleanWei);
    
    // Convert to string and pad for decimal conversion
    const weiStr = weiNum.toString();
    const paddedWei = weiStr.padStart(19, '0');
    const wholePart = paddedWei.slice(0, -18) || '0';
    const decimalPart = paddedWei.slice(-18);
    
    // Format with 4 decimal places
    const formatted = wholePart + '.' + decimalPart.slice(0, 4);
    return formatted;
  };

  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    
    try {
      // Request accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Get chain ID
      const chain = await window.ethereum.request({
        method: 'eth_chainId'
      });
      
      setAccount(accounts[0]);
      setChainId(parseInt(chain, 16));
      
      // Get balance
      await updateBalance(accounts[0]);
      
      // Check validator status
      await checkValidatorStatus(accounts[0]);
      
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet');
    }
  };

  // Update balance
  const updateBalance = async (address) => {
    try {
      const balanceCall = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_ADDRESS,
          data: '0x70a08231' + address.slice(2).padStart(64, '0')
        }, 'latest']
      });
      
      setBalance(fromWei(balanceCall));
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  // Check validator status
  const checkValidatorStatus = async (address) => {
    try {
      const validatorCall = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_ADDRESS,
          data: '0x3926f791' + address.slice(2).padStart(64, '0')
        }, 'latest']
      });
      
      const isApproved = validatorCall !== '0x0000000000000000000000000000000000000000000000000000000000000000';
      setIsValidator(isApproved);
    } catch (error) {
      console.error('Validator check error:', error);
    }
  };

  // Switch to Sepolia
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      });
      setChainId(SEPOLIA_CHAIN_ID);
    } catch (error) {
      console.error('Network switch error:', error);
      alert('Please switch to Sepolia network manually in MetaMask');
    }
  };

  // Calculate distance between GPS points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };

  // Handle GPS position updates
  const handleGPSUpdate = useCallback((position) => {
    const { latitude, longitude, accuracy, speed } = position.coords;
    positionCount.current++;
    
    setGpsAccuracy(accuracy);
    
    // Update GPS status
    if (accuracy <= 10) {
      setGpsStatus(`📍 High Accuracy (±${accuracy.toFixed(0)}m)`);
    } else if (accuracy <= 30) {
      setGpsStatus(`📍 Good GPS (±${accuracy.toFixed(0)}m)`);
    } else if (accuracy <= 50) {
      setGpsStatus(`📍 Fair GPS (±${accuracy.toFixed(0)}m)`);
    } else {
      setGpsStatus(`⚠️ Poor GPS (±${accuracy.toFixed(0)}m)`);
    }
    
    // Use device speed if available
    if (speed !== null && speed > 0) {
      setCurrentSpeed(speed * 3.6); // Convert m/s to km/h
    }
    
    if (lastPositionRef.current) {
      const dist = calculateDistance(
        lastPositionRef.current.lat,
        lastPositionRef.current.lon,
        latitude,
        longitude
      );
      
      // More lenient movement detection for walking/running
      // Accept movement if distance > 2 meters and accuracy is reasonable
      if (dist > 2 && dist < 200 && accuracy < 50) {
        setDistance(prev => {
          const newDistance = prev + dist;
          console.log(`Distance update: +${dist.toFixed(2)}m, Total: ${newDistance.toFixed(2)}m`);
          return newDistance;
        });
        
        // Calculate speed if device doesn't provide it
        if (speed === null || speed === 0) {
          const timeDiff = (Date.now() - lastPositionRef.current.time) / 1000;
          if (timeDiff > 0) {
            const calculatedSpeed = (dist / timeDiff) * 3.6; // km/h
            setCurrentSpeed(calculatedSpeed);
          }
        }
      }
    }
    
    lastPositionRef.current = {
      lat: latitude,
      lon: longitude,
      time: Date.now()
    };
  }, []);

  // Start GPS tracking
  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      alert('GPS not supported on this device!');
      return;
    }
    
    setGpsStatus('🔄 Starting GPS...');
    positionCount.current = 0;
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleGPSUpdate(position);
        console.log('Initial position acquired');
      },
      (error) => {
        console.error('Initial position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
    
    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleGPSUpdate,
      (error) => {
        console.error('GPS Error:', error);
        if (error.code === 1) {
          setGpsStatus('❌ Location denied');
          alert('Location permission denied. Please enable in settings and refresh.');
        } else if (error.code === 2) {
          setGpsStatus('⚠️ GPS unavailable');
        } else if (error.code === 3) {
          setGpsStatus('⏱️ GPS timeout');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        distanceFilter: 1 // Update every meter
      }
    );
  };

  // Start run
  const startRun = () => {
    setRunState('running');
    setDistance(0);
    setElapsedTime(0);
    setCurrentSpeed(0);
    startTimeRef.current = Date.now();
    lastPositionRef.current = null;
    
    startGPSTracking();
    
    // Timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  // Stop run
  const stopRun = () => {
    setRunState('stopped');
    
    // Clear GPS
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    console.log(`Run ended. Distance: ${distance.toFixed(2)}m, GPS updates: ${positionCount.current}`);
    setGpsStatus('Stopped');
  };

  // Submit to blockchain
  const submitToBlockchain = async () => {
    if (!account) {
      alert('Please connect wallet first!');
      return;
    }
    
    if (chainId !== SEPOLIA_CHAIN_ID) {
      alert('Please switch to Sepolia network!');
      await switchToSepolia();
      return;
    }
    
    if (!isValidator && distance < 100) {
      alert(`Since you're not an approved validator, this is a TEST submission.\nDistance: ${distance.toFixed(0)}m\nNote: Tokens won't be minted until admin approval.`);
    }
    
    if (distance < 10) {
      alert(`Distance too short! Minimum 10m required. You have ${distance.toFixed(0)}m`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const distanceInt = Math.floor(distance);
      const durationInt = elapsedTime;
      
      // Calculate expected FYTS
      const expectedFYTS = calculateExpectedFYTS(distanceInt);
      
      // Create proof data
      const proofData = `data:${JSON.stringify({
        distance: distanceInt,
        duration: durationInt,
        timestamp: Date.now(),
        gpsUpdates: positionCount.current,
        accuracy: gpsAccuracy
      })}`;
      
      // Encode function call for submitValidation
      // Function signature: submitValidation(uint256,uint256,string)
      const functionSig = '0xf09cc9b3'; // submitValidation signature
      
      // For complex encoding, we'll use eth_sendTransaction directly
      const tx = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: CONTRACT_ADDRESS,
          gas: toHex(300000),
          data: functionSig + 
                distanceInt.toString(16).padStart(64, '0') +
                durationInt.toString(16).padStart(64, '0') +
                '0000000000000000000000000000000000000000000000000000000000000060' + // offset for string
                toHex(proofData.length).slice(2).padStart(64, '0') +
                Buffer.from(proofData).toString('hex').padEnd(Math.ceil(proofData.length / 32) * 64, '0')
        }]
      });
      
      setTxHash(tx);
      alert(`✅ Transaction submitted!\n\nDistance: ${distanceInt}m\nExpected FYTS: ~${expectedFYTS.toFixed(2)}\nTx Hash: ${tx.slice(0, 10)}...${tx.slice(-8)}\n\n⏳ Waiting for confirmation...`);
      
      // Wait for transaction receipt
      let receipt = null;
      let attempts = 0;
      while (!receipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [tx]
          });
        } catch (e) {
          console.log('Waiting for receipt...');
        }
        attempts++;
      }
      
      if (receipt && receipt.status === '0x1') {
        alert(`🎉 SUCCESS!\n\nValidation submitted to blockchain!\nDistance: ${distanceInt}m\nExpected reward: ~${expectedFYTS.toFixed(2)} FYTS\n\n${isValidator ? 'Tokens will be minted after admin approval.' : 'TEST MODE: Admin approval required for token minting.'}`);
        
        // Update balance
        await updateBalance(account);
      } else if (receipt && receipt.status === '0x0') {
        alert('Transaction failed! Check if you have enough ETH for gas.');
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      if (error.code === 4001) {
        alert('Transaction cancelled');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient ETH for gas! Get free Sepolia ETH from:\n\n• sepoliafaucet.com\n• faucet.sepolia.dev\n• sepolia-faucet.pk910.de');
      } else {
        alert(`Error: ${error.message?.substring(0, 100) || 'Transaction failed'}`);
      }
    }
    
    setIsSubmitting(false);
  };

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate pace
  const calculatePace = () => {
    if (distance === 0) return '--:--';
    const kmDistance = distance / 1000;
    if (kmDistance === 0) return '--:--';
    const minutes = elapsedTime / 60;
    const pace = minutes / kmDistance;
    if (!isFinite(pace)) return '--:--';
    const paceMin = Math.floor(pace);
    const paceSec = Math.floor((pace - paceMin) * 60);
    return `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
  };

  // Calculate expected FYTS for display
  const expectedFYTS = calculateExpectedFYTS(distance);

  // Auto-refresh balance when account changes
  useEffect(() => {
    if (account) {
      const interval = setInterval(() => {
        updateBalance(account);
      }, 10000); // Every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [account]);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateBalance(accounts[0]);
          checkValidatorStatus(accounts[0]);
        } else {
          setAccount(null);
        }
      });
      
      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
      });
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '10px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '15px',
        marginBottom: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          margin: '0 0 10px 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          FYTS FITNESS TRACKER
        </h1>
        
        {account ? (
          <div>
            <div style={{ fontSize: '0.9rem', marginBottom: '5px', color: '#666' }}>
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '1.3rem',
              color: '#333'
            }}>
              {parseFloat(balance).toFixed(4)} FYTS
            </div>
            {!isValidator && (
              <div style={{ 
                color: '#ff9800', 
                fontSize: '0.8rem', 
                marginTop: '5px',
                padding: '5px',
                background: '#fff3e0',
                borderRadius: '5px'
              }}>
                ⚠️ Test Mode (not approved validator)
              </div>
            )}
            {chainId && chainId !== SEPOLIA_CHAIN_ID && (
              <button 
                onClick={switchToSepolia}
                style={{ 
                  marginTop: '5px',
                  padding: '5px 10px',
                  background: '#ff5252',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Switch to Sepolia
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            Connect MetaMask
          </button>
        )}
      </div>

      {/* Main Display */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Distance Display */}
        <div style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#333',
          lineHeight: 1
        }}>
          {distance.toFixed(1)}m
        </div>
        
        {/* FYTS Conversion Display */}
        <div style={{
          textAlign: 'center',
          fontSize: '1.8rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          ≈ {expectedFYTS.toFixed(2)} FYTS
        </div>
        
        <div style={{
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#999',
          marginBottom: '15px'
        }}>
          Base: 10 FYTS + {(distance/100).toFixed(2)} distance bonus
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '15px 10px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>
              {formatTime(elapsedTime)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Time</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            padding: '15px 10px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>
              {currentSpeed.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>km/h</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            padding: '15px 10px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>
              {calculatePace()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>min/km</div>
          </div>
        </div>

        {/* GPS Status */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          background: gpsStatus.includes('High') ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' :
                      gpsStatus.includes('Good') ? 'linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%)' :
                      gpsStatus.includes('Fair') ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' :
                      'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
          borderRadius: '12px',
          marginBottom: '15px',
          fontSize: '0.95rem',
          fontWeight: '500'
        }}>
          {gpsStatus}
        </div>

        {/* Control Buttons */}
        {runState === 'idle' && (
          <button 
            onClick={startRun}
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(56, 239, 125, 0.3)',
              transition: 'transform 0.2s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🏃 START RUN
          </button>
        )}

        {runState === 'running' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              onClick={stopRun}
              style={{
                padding: '18px',
                background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(252, 74, 26, 0.3)'
              }}
            >
              ⏹️ STOP
            </button>
            
            {/* Debug button for testing */}
            <button 
              onClick={() => setDistance(prev => prev + 100)}
              style={{
                padding: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}
            >
              +100m
            </button>
          </div>
        )}

        {runState === 'stopped' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
              padding: '20px',
              borderRadius: '15px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                🏁 Run Complete!
              </div>
              <div style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
                Distance: <strong>{distance.toFixed(1)}m</strong>
              </div>
              <div style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
                Time: <strong>{formatTime(elapsedTime)}</strong>
              </div>
              <div style={{ 
                fontSize: '1.3rem', 
                marginTop: '10px',
                padding: '10px',
                background: 'white',
                borderRadius: '10px',
                color: '#667eea',
                fontWeight: 'bold'
              }}>
                Potential Reward: {expectedFYTS.toFixed(2)} FYTS
              </div>
              {txHash && (
                <div style={{ 
                  marginTop: '10px',
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </div>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={submitToBlockchain}
                disabled={isSubmitting}
                style={{
                  padding: '15px',
                  background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}
              >
                {isSubmitting ? '⏳ SUBMITTING...' : '💎 CLAIM FYTS'}
              </button>
              
              <button 
                onClick={() => {
                  setRunState('idle');
                  setDistance(0);
                  setElapsedTime(0);
                  setTxHash(null);
                }}
                style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #868f96 0%, #596164 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1.1rem'
                }}
              >
                🔄 NEW RUN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '15px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📊 Reward System</h3>
        <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.6 }}>
          <div>• Base reward: <strong>10 FYTS</strong></div>
          <div>• Distance bonus: <strong>1 FYTS per 100m</strong></div>
          <div>• Duration bonus: <strong>+5 FYTS</strong> (30+ min)</div>
          <div>• GPS updates received: <strong>{positionCount.current}</strong></div>
        </div>
      </div>
    </div>
  );
}