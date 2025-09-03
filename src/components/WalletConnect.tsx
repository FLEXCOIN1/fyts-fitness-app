import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useState } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors, connect } = useConnect();
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Your owner address
  const OWNER_ADDRESS = '0xCc1Bb5FE5cF57EEEE54792445586D3379E287d47';
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  if (isConnected) {
    return (
      <div className="wallet-section">
        <div className="wallet-connected">
          <div className="wallet-info">
            <div className="wallet-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Connected to Protocol
            </div>
          </div>
          <button onClick={() => disconnect()} className="disconnect-btn">
            Disconnect
          </button>
        </div>
        
        {isOwner && (
          <div style={{ marginTop: '1rem' }}>
            <button 
              onClick={() => setShowAdmin(!showAdmin)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: '0.5rem',
                color: '#fbbf24',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {showAdmin ? 'Hide' : 'Show'} Protocol Controls
            </button>
            
            {showAdmin && (
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9ca3af'
              }}>
                Protocol Owner Dashboard - Launch Configuration Active
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const availableWallets = ['WalletConnect', 'Coinbase Wallet'];

  return (
    <div className="wallet-section">
      <h3>Connect to Protocol</h3>
      <p className="network-description">
        Initialize wallet connection to participate in the movement validation protocol
      </p>
      <div>
        {connectors.map((connector) => {
          const isAvailable = availableWallets.includes(connector.name);
          
          return (
            <button
              key={connector.id}
              onClick={() => isAvailable && connect({ connector })}
              className="connect-wallet-btn"
              disabled={!isAvailable}
              style={{
                background: !isAvailable ? 'rgba(255, 255, 255, 0.03)' : undefined,
                color: !isAvailable ? 'rgba(255, 255, 255, 0.3)' : undefined,
                border: !isAvailable ? '1px solid rgba(255, 255, 255, 0.1)' : undefined,
                cursor: !isAvailable ? 'not-allowed' : 'pointer',
                position: 'relative'
              }}
            >
              {connector.name}
              {!isAvailable && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  Coming Soon
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}