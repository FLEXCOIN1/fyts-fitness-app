import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { useState, useEffect } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { switchChain, chains } = useSwitchChain();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<string[]>([
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bE8b' // Example admin - replace with your address
  ]);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [protocolPaused, setProtocolPaused] = useState(false);

  useEffect(() => {
    if (address && admins.includes(address)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [address, admins]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const addAdmin = () => {
    if (newAdminAddress && newAdminAddress.startsWith('0x') && newAdminAddress.length === 42) {
      setAdmins([...admins, newAdminAddress]);
      setNewAdminAddress('');
    }
  };

  const removeAdmin = (adminToRemove: string) => {
    setAdmins(admins.filter(admin => admin !== adminToRemove));
  };

  const getCurrentChainName = () => {
    const chain = chains.find(c => c.id === chainId);
    return chain?.name || 'Unknown';
  };

  if (!isConnected) {
    return (
      <div className="wallet-section">
        <h3>🔗 Connect to FytS Protocol</h3>
        <p className="network-description">
          Connect your wallet to participate in the decentralized movement validation network
        </p>
        <div>
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              disabled={isPending}
              className="connect-wallet-btn"
            >
              Connect with {connector.name}
            </button>
          ))}
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Error: {error.message}
        </p>}
      </div>
    );
  }

  return (
    <div className="wallet-section">
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-address">{formatAddress(address || '')}</div>
          {balance && (
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </div>
          )}
        </div>
        <div className="network-status">
          <span className="status-badge" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {getCurrentChainName()}
          </span>
          <button onClick={() => disconnect()} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      </div>

      {/* Network Switcher */}
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {chains.map((chain) => (
          <button
            key={chain.id}
            onClick={() => switchChain({ chainId: chain.id })}
            className="admin-btn"
            style={{ 
              opacity: chain.id === chainId ? 1 : 0.6,
              transform: chain.id === chainId ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {chain.name}
          </button>
        ))}
      </div>

      {/* Admin Panel - Only shows if connected wallet is an admin */}
      {isAdmin && (
        <>
          <div className="admin-management">
            <h4>⚡ Admin Management</h4>
            
            <h5>Current Admins</h5>
            <div className="admin-list">
              {admins.map((admin) => (
                <div key={admin} className="admin-item">
                  <span className="admin-address">{formatAddress(admin)}</span>
                  {admin !== address && (
                    <button 
                      onClick={() => removeAdmin(admin)}
                      className="admin-btn remove"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="add-admin-form">
              <input
                type="text"
                placeholder="0x..."
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                className="admin-input"
              />
              <button onClick={addAdmin} className="admin-btn add-admin">
                Add Admin
              </button>
            </div>
          </div>

          <div className="admin-controls">
            <h4>🎮 Protocol Controls</h4>
            <div className="control-buttons">
              <button 
                onClick={() => setProtocolPaused(!protocolPaused)}
                className={`admin-btn ${protocolPaused ? 'standard' : 'emergency'}`}
              >
                {protocolPaused ? 'Resume Protocol' : 'Emergency Pause'}
              </button>
              <button className="admin-btn confirm">
                Validate Pending
              </button>
              <button className="admin-btn standard">
                Update Parameters
              </button>
            </div>
            {protocolPaused && (
              <p style={{ color: '#fbbf24', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                ⚠️ Protocol is currently paused
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}