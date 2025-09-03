import React from 'react';

const StakingDashboard: React.FC = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#10b981', marginBottom: '2rem' }}>Staking Protocol</h2>
      
      <div style={{
        background: 'rgba(251, 191, 36, 0.1)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Staking Module Initializing</h3>
        <p style={{ color: '#fed7aa' }}>
          Commitment-based staking protocols will be activated in Phase 2
        </p>
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            Expected activation: Protocol Version 2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default StakingDashboard;