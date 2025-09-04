import React from 'react';

const LeaderboardsDashboard: React.FC = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#10b981', marginBottom: '2rem' }}>Network Rankings</h2>
      
      <div style={{
        background: 'rgba(139, 92, 246, 0.1)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h3 style={{ color: '#a78bfa', marginBottom: '1rem' }}>Ranking System Pending</h3>
        <p style={{ color: '#e9d5ff' }}>
          Global validator rankings and performance metrics coming soon
        </p>
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            Network consensus required for ranking initialization
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsDashboard;