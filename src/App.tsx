import { useState, useEffect, useRef, useCallback } from 'react';

// CHANGE THIS TO YOUR NEW CONTRACT ADDRESS AFTER DEPLOYMENT
const CONTRACT_ADDRESS = '';

export default function App() {
  // Core state
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isRunning, setIsRunning] = useState(false);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('Ready');
  const [lastPosition, setLastPosition] = useState(null);
  
  // Refs
  const watchId = useRef(null);
  const timer = useRef(null);
  const startTime = useRef(null);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await updateBalance(accounts[0]);
    } catch (error) {
      alert('Failed to connect wallet');
    }
  };

  // Update balance
  const updateBalance = async (address) => {
    try {
      const result = await ethereum.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_ADDRESS,
          data: '0x70a08231' + address.slice(2).padStart(64, '0')
        }, 'latest']
      });
      
      // Convert hex to decimal and format
      const wei = parseInt(result, 16);
      const fyts = wei / (10 ** 18);
      setBalance(fyts.toFixed(2));
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  // Calculate distance between two GPS points (in meters)
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

  // Start run
  const startRun = () => {
    setIsRunning(true);
    setDistance(0);
    setTime(0);
    setLastPosition(null);
    startTime.current = Date.now();
    
    // Start timer
    timer.current = setInterval(() => {
      setTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    
    // Start GPS tracking
    if (navigator.geolocation) {
      setGpsStatus('Acquiring GPS...');
      
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLastPosition({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setGpsStatus('GPS Active');
        },
        (error) => {
          setGpsStatus('GPS Error - Use manual buttons');
          console.error('GPS Error:', error);
        },
        { enableHighAccuracy: true }
      );
      
      // Watch position
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          if (lastPosition) {
            const dist = calculateDistance(
              lastPosition.lat, lastPosition.lon,
              newPos.lat, newPos.lon
            );
            
            // Only add distance if movement is reasonable (1-100m)
            if (dist > 1 && dist < 100) {
              setDistance(prev => prev + dist);
            }
          }
          
          setLastPosition(newPos);
          setGpsStatus(`GPS Active (±${Math.round(position.coords.accuracy)}m)`);
        },
        (error) => {
          setGpsStatus('GPS Lost - Use manual');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    } else {
      setGpsStatus('No GPS - Use manual buttons');
    }
  };

  // Stop run
  const stopRun = () => {
    setIsRunning(false);
    
    // Clear GPS
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    // Clear timer
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    
    setGpsStatus('Stopped');
  };

  // Submit validation
  const submitValidation = async () => {
    if (!account) {
      alert('Please connect wallet first!');
      return;
    }
    
    if (distance < 10) {
      alert('Minimum distance is 10 meters');
      return;
    }
    
    try {
      const distanceInt = Math.floor(distance);
      const data = JSON.stringify({
        distance: distanceInt,
        time: time,
        timestamp: Date.now()
      });
      
      // Encode function call
      const functionSig = '0xf09cc9b3';
      const encodedData = functionSig +
        distanceInt.toString(16).padStart(64, '0') +
        time.toString(16).padStart(64, '0') +
        '0000000000000000000000000000000000000000000000000000000000000060' +
        (data.length).toString(16).padStart(64, '0') +
        Buffer.from(data).toString('hex').padEnd(Math.ceil(data.length / 32) * 64, '0');
      
      const tx = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: CONTRACT_ADDRESS,
          data: encodedData,
          gas: '0x30000'
        }]
      });
      
      alert(`Validation submitted!\nTx: ${tx.slice(0,10)}...\nDistance: ${distanceInt}m\nReward: ~${10 + distanceInt/100} FYTS\n\nTokens will be distributed after admin approval.`);
      
      // Reset
      setDistance(0);
      setTime(0);
      
    } catch (error) {
      alert('Submission failed: ' + error.message);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-refresh balance
  useEffect(() => {
    if (account) {
      const interval = setInterval(() => {
        updateBalance(account);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [account]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>
          FYTS FITNESS REWARDS
        </h1>
        
        {account ? (
          <div>
            <div style={{ marginBottom: '10px', color: '#666' }}>
              {account.slice(0,6)}...{account.slice(-4)}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
              {balance} FYTS
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              Fitness rewards token - Not a financial investment
            </div>
          </div>
        ) : (
          <button onClick={connectWallet} style={{
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            Connect Wallet
          </button>
        )}
      </div>

      {/* Main tracking area */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        {/* Distance display */}
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#333',
          marginBottom: '10px'
        }}>
          {distance.toFixed(1)}m
        </div>
        
        {/* Time display */}
        <div style={{
          fontSize: '24px',
          textAlign: 'center',
          color: '#666',
          marginBottom: '20px'
        }}>
          {formatTime(time)}
        </div>
        
        {/* GPS Status */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          background: gpsStatus.includes('Active') ? '#d4edda' : '#f8d7da',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          {gpsStatus}
        </div>
        
        {/* Controls */}
        {!isRunning ? (
          <button onClick={startRun} style={{
            width: '100%',
            padding: '20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            START RUN
          </button>
        ) : (
          <div>
            <button onClick={stopRun} style={{
              width: '100%',
              padding: '20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}>
              STOP RUN
            </button>
            
            {/* Manual distance buttons for testing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setDistance(d => d + 10)} style={{
                padding: '15px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}>
                +10m Manual
              </button>
              <button onClick={() => setDistance(d => d + 100)} style={{
                padding: '15px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}>
                +100m Manual
              </button>
            </div>
          </div>
        )}
        
        {/* Submit button (shows when stopped with distance) */}
        {!isRunning && distance > 0 && (
          <button onClick={submitValidation} style={{
            width: '100%',
            padding: '20px',
            marginTop: '20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            SUBMIT FOR REWARDS ({(10 + distance/100).toFixed(1)} FYTS)
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        fontSize: '14px',
        color: '#666'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>How It Works</h3>
        <div>1. Start a run to track your fitness activity</div>
        <div>2. GPS will track distance (or use manual buttons)</div>
        <div>3. Submit your activity for reward tokens</div>
        <div>4. Receive FYTS tokens after admin verification</div>
        <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
          Reward: 10 FYTS base + 1 FYTS per 100m
        </div>
      </div>
    </div>
  );
}
