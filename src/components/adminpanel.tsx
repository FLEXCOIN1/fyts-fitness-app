import { useAccount } from 'wagmi';

// Simple admin panel component
export function AdminPanel() {
  const { address, isConnected } = useAccount();
  
  // Admin addresses - add your address here
  const adminAddresses = [
    '0xCc1Bb5FE5cF57EEEE54792445586D3379E287d47' // Your address
  ];
  
  const isAdmin = address && adminAddresses.includes(address);
  
  if (!isConnected || !isAdmin) {
    return null;
  }
  
  return (
    <div className="admin-panel" style={{
      padding: '1rem',
      background: 'rgba(251, 191, 36, 0.1)',
      borderRadius: '0.75rem',
      border: '1px solid rgba(251, 191, 36, 0.3)',
      margin: '1rem'
    }}>
      <h3 style={{ color: '#fbbf24' }}>Admin Panel</h3>
      <p style={{ color: '#d1d5db' }}>
        Welcome, admin! You have access to protocol controls.
      </p>
      {/* Add any admin functionality here */}
    </div>
  );
}