// components/LeaderboardsDashboard.tsx
import { useState } from 'react';
import { useAccount } from 'wagmi';

interface LeaderboardEntry {
  rank: number;
  address: string;
  value: number | string;
  secondary?: string;
  badge?: string;
}

// Mock data for leaderboards
const leaderboardData = {
  totalDistance: [
    { rank: 1, address: '0x742d...9e8b', value: 287.5, secondary: '142 validations', badge: '🥇' },
    { rank: 2, address: '0xCc1B...7d47', value: 245.3, secondary: '128 validations', badge: '🥈' },
    { rank: 3, address: '0x9f2a...3c21', value: 198.7, secondary: '95 validations', badge: '🥉' },
    { rank: 4, address: '0x3d4e...8a92', value: 176.2, secondary: '88 validations' },
    { rank: 5, address: '0x8b5c...2f1d', value: 164.9, secondary: '82 validations' },
    { rank: 6, address: '0x1a2b...3c4d', value: 152.3, secondary: '76 validations' },
    { rank: 7, address: '0x5e6f...7a8b', value: 141.8, secondary: '71 validations' },
    { rank: 8, address: '0x9c0d...1e2f', value: 128.5, secondary: '64 validations' },
    { rank: 9, address: '0x3a4b...5c6d', value: 115.2, secondary: '58 validations' },
    { rank: 10, address: '0x7e8f...9a0b', value: 102.7, secondary: '51 validations' },
  ],
  weeklyDistance: [
    { rank: 1, address: '0x8b5c...2f1d', value: 42.8, secondary: '7 days streak', badge: '🔥' },
    { rank: 2, address: '0x742d...9e8b', value: 38.5, secondary: '6 days streak' },
    { rank: 3, address: '0xCc1B...7d47', value: 35.2, secondary: '7 days streak' },
    { rank: 4, address: '0x1a2b...3c4d', value: 31.6, secondary: '5 days streak' },
    { rank: 5, address: '0x5e6f...7a8b', value: 28.9, secondary: '4 days streak' },
  ],
  fastest3Miles: [
    { rank: 1, address: '0x5e6f...7a8b', value: '14:32', secondary: '4:51/mi pace', badge: '⚡' },
    { rank: 2, address: '0x3d4e...8a92', value: '15:18', secondary: '5:06/mi pace' },
    { rank: 3, address: '0x742d...9e8b', value: '15:45', secondary: '5:15/mi pace' },
    { rank: 4, address: '0x9f2a...3c21', value: '16:12', secondary: '5:24/mi pace' },
    { rank: 5, address: '0xCc1B...7d47', value: '16:38', secondary: '5:33/mi pace' },
  ],
  fastest5Miles: [
    { rank: 1, address: '0x3d4e...8a92', value: '25:45', secondary: '5:09/mi pace', badge: '⚡' },
    { rank: 2, address: '0x5e6f...7a8b', value: '26:30', secondary: '5:18/mi pace' },
    { rank: 3, address: '0x9f2a...3c21', value: '27:15', secondary: '5:27/mi pace' },
    { rank: 4, address: '0x742d...9e8b', value: '28:02', secondary: '5:36/mi pace' },
    { rank: 5, address: '0x1a2b...3c4d', value: '28:48', secondary: '5:46/mi pace' },
  ],
  fastest10Miles: [
    { rank: 1, address: '0x9f2a...3c21', value: '54:30', secondary: '5:27/mi pace', badge: '⚡' },
    { rank: 2, address: '0x3d4e...8a92', value: '56:15', secondary: '5:38/mi pace' },
    { rank: 3, address: '0x8b5c...2f1d', value: '58:20', secondary: '5:50/mi pace' },
    { rank: 4, address: '0xCc1B...7d47', value: '59:45', secondary: '5:59/mi pace' },
    { rank: 5, address: '0x742d...9e8b', value: '61:30', secondary: '6:09/mi pace' },
  ],
  tokenAllocation: [
    { rank: 1, address: '0xCc1B...7d47', value: 8547.3, secondary: '142 validations', badge: '💎' },
    { rank: 2, address: '0x742d...9e8b', value: 7893.5, secondary: '128 validations' },
    { rank: 3, address: '0x8b5c...2f1d', value: 6452.8, secondary: '105 validations' },
    { rank: 4, address: '0x9f2a...3c21', value: 5234.2, secondary: '87 validations' },
    { rank: 5, address: '0x3d4e...8a92', value: 4867.9, secondary: '81 validations' },
  ]
};

export default function LeaderboardsDashboard() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'distance' | 'speed' | 'allocation'>('distance');
  const [distanceTab, setDistanceTab] = useState<'total' | 'weekly'>('total');
  const [speedTab, setSpeedTab] = useState<'3miles' | '5miles' | '10miles'>('3miles');

  const formatAddress = (addr: string) => {
    // Highlight if it's the current user
    if (address && addr.toLowerCase().includes(address.slice(2, 6).toLowerCase())) {
      return <span className="current-user-address">{addr} (You)</span>;
    }
    return addr;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  return (
    <div className="leaderboards-dashboard">
      {/* Main Category Tabs */}
      <div className="leaderboard-tabs">
        <button 
          className={activeTab === 'distance' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('distance')}
        >
          📊 Distance Metrics
        </button>
        <button 
          className={activeTab === 'speed' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('speed')}
        >
          ⚡ Velocity Records
        </button>
        <button 
          className={activeTab === 'allocation' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('allocation')}
        >
          💎 Token Allocation
        </button>
      </div>

      {/* Distance Leaderboards */}
      {activeTab === 'distance' && (
        <div className="leaderboard-section">
          <div className="sub-tabs">
            <button 
              className={distanceTab === 'total' ? 'sub-tab active' : 'sub-tab'}
              onClick={() => setDistanceTab('total')}
            >
              All-Time Distance
            </button>
            <button 
              className={distanceTab === 'weekly' ? 'sub-tab active' : 'sub-tab'}
              onClick={() => setDistanceTab('weekly')}
            >
              Weekly Distance
            </button>
          </div>

          <div className="leaderboard-container">
            <div className="leaderboard-header">
              <h3>
                {distanceTab === 'total' ? 'Total Distance Validated' : 'Weekly Distance Leaders'}
              </h3>
              <p className="leaderboard-subtitle">
                {distanceTab === 'total' 
                  ? 'Cumulative validation distance across all sessions'
                  : 'Top validators for current week'}
              </p>
            </div>

            <div className="leaderboard-list">
              {(distanceTab === 'total' ? leaderboardData.totalDistance : leaderboardData.weeklyDistance)
                .map(entry => (
                  <div key={entry.rank} className={`leaderboard-entry rank-${getRankColor(entry.rank)}`}>
                    <div className="rank-badge">
                      {entry.badge || `#${entry.rank}`}
                    </div>
                    <div className="entry-info">
                      <div className="address">{formatAddress(entry.address)}</div>
                      <div className="secondary-info">{entry.secondary}</div>
                    </div>
                    <div className="entry-value">
                      <div className="primary-value">{entry.value} km</div>
                      <div className="value-label">validated</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Speed Leaderboards */}
      {activeTab === 'speed' && (
        <div className="leaderboard-section">
          <div className="sub-tabs">
            <button 
              className={speedTab === '3miles' ? 'sub-tab active' : 'sub-tab'}
              onClick={() => setSpeedTab('3miles')}
            >
              3 Mile Record
            </button>
            <button 
              className={speedTab === '5miles' ? 'sub-tab active' : 'sub-tab'}
              onClick={() => setSpeedTab('5miles')}
            >
              5 Mile Record
            </button>
            <button 
              className={speedTab === '10miles' ? 'sub-tab active' : 'sub-tab'}
              onClick={() => setSpeedTab('10miles')}
            >
              10 Mile Record
            </button>
          </div>

          <div className="leaderboard-container">
            <div className="leaderboard-header">
              <h3>Fastest {speedTab === '3miles' ? '3' : speedTab === '5miles' ? '5' : '10'} Mile Validation</h3>
              <p className="leaderboard-subtitle">
                Single session velocity records
              </p>
            </div>

            <div className="leaderboard-list">
              {(speedTab === '3miles' 
                ? leaderboardData.fastest3Miles 
                : speedTab === '5miles' 
                ? leaderboardData.fastest5Miles 
                : leaderboardData.fastest10Miles
              ).map(entry => (
                <div key={entry.rank} className={`leaderboard-entry rank-${getRankColor(entry.rank)}`}>
                  <div className="rank-badge">
                    {entry.badge || `#${entry.rank}`}
                  </div>
                  <div className="entry-info">
                    <div className="address">{formatAddress(entry.address)}</div>
                    <div className="secondary-info">{entry.secondary}</div>
                  </div>
                  <div className="entry-value">
                    <div className="primary-value">{entry.value}</div>
                    <div className="value-label">time</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Token Allocation Leaderboard */}
      {activeTab === 'allocation' && (
        <div className="leaderboard-section">
          <div className="leaderboard-container">
            <div className="leaderboard-header">
              <h3>Top Token Recipients</h3>
              <p className="leaderboard-subtitle">
                Cumulative FYTS allocation from protocol participation
              </p>
            </div>

            <div className="leaderboard-list">
              {leaderboardData.tokenAllocation.map(entry => (
                <div key={entry.rank} className={`leaderboard-entry rank-${getRankColor(entry.rank)}`}>
                  <div className="rank-badge">
                    {entry.badge || `#${entry.rank}`}
                  </div>
                  <div className="entry-info">
                    <div className="address">{formatAddress(entry.address)}</div>
                    <div className="secondary-info">{entry.secondary}</div>
                  </div>
                  <div className="entry-value">
                    <div className="primary-value">{entry.value.toLocaleString()}</div>
                    <div className="value-label">FYTS allocated</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Network Statistics */}
      <div className="network-stats">
        <h3>Network Validation Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">1,247</div>
            <div className="stat-label">Active Validators</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">8,932 km</div>
            <div className="stat-label">Total Distance Validated</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">524,780</div>
            <div className="stat-label">FYTS Allocated</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98.7%</div>
            <div className="stat-label">Validation Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}