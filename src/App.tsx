import { useRunTracker } from './useRunTracker';
import './App.css';

export default function App() {
  const { state, formattedStats, start, pause, resume, end, discard } = useRunTracker();

  return (
    <div className="app-container">
      {/* Background */}
      <div className="background-gradient"></div>
      
      {/* Header */}
      <div className="header">
        <div className="logo-container">
          <div className="logo">F</div>
        </div>
        <h1 className="app-title">FYTS FITNESS</h1>
        <p className="app-subtitle">Professional GPS Tracking</p>
      </div>

      {/* Status */}
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

      {/* Main Distance */}
      <div className="distance-container">
        <div className="distance-value">
          {formattedStats.distance.split(' ')[0]}
        </div>
        <div className="distance-unit">
          {formattedStats.distance.split(' ')[1] || 'ft'}
        </div>
        <div className="distance-label">Distance</div>
      </div>

      {/* Stats Grid */}
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

      {/* Action Buttons */}
      <div className="action-container">
        {state === 'idle' && (
          <button onClick={start} className="start-button">
            <div className="button-icon">▶</div>
            <div className="button-text">START</div>
            <div className="button-subtitle">Tap to begin</div>
          </button>
        )}
        
        {(state === 'running' || state === 'stationary') && (
          <div className="button-group">
            <button onClick={pause} className="action-button pause">⏸</button>
            <button onClick={end} className="action-button stop">⏹</button>
          </div>
        )}
        
        {state === 'paused' && (
          <div className="button-group">
            <button onClick={resume} className="action-button resume">▶</button>
            <button onClick={end} className="action-button stop">⏹</button>
          </div>
        )}
        
        {state === 'ended' && (
          <div className="completion-container">
            <div className="completion-card">
              <div className="completion-emoji">🏃‍♂️</div>
              <h2 className="completion-title">Workout Complete!</h2>
              <p className="completion-subtitle">Amazing job on your run</p>
              <div className="completion-stats">
                <div className="completion-distance">{formattedStats.distance}</div>
                <div className="completion-label">Total Distance</div>
              </div>
            </div>
            <button onClick={discard} className="new-run-button">
              <div className="button-icon">★</div>
              <div className="button-text">NEW RUN</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}