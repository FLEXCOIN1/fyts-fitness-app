import { useRunTracker } from './useRunTracker';
import './App.css';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    let interval;
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

  const formatDistanceWithBoth = (meters) => {
    const km = (meters / 1000).toFixed(2);
    const miles = (meters * 0.000621371).toFixed(2);
    
    if (meters >= 1000) {
      return `${km} km (${miles} mi)`;
    }
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft (${(feet * 0.000189394).toFixed(3)} mi)`;
  };

  return (
    <div className="app-container">
      <div className="background-gradient"></div>
      
      <div className="header">
        <div className="logo-container">
          <div className="logo">F</div>
        </div>
        <h1 className="app-title">FYTS FITNESS</h1>
      </div>

      {(state === 'running' || state === 'stationary') && (
        <div className="motivation-container">
          <div className="motivation-quote">
            "{motivationalQuotes[currentQuoteIndex]}"
          </div>
        </div>
      )}

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

      <div className="distance-container">
        <div className="distance-value">
          {formatDistanceWithBoth(stats.distanceMeters)}
        </div>
        <div className="distance-label">Distance</div>
      </div>

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

      <div className="action-container">
        {state === 'idle' && (
          <button 
            onClick={start}
            className="start-button"
          >
            <div className="button-icon">▶</div>
            <div className="button-text">START</div>
            <div className="button-subtitle">Tap to begin</div>
          </button>
        )}
        
        {(state === 'running' || state === 'stationary') && (
          <div className="button-group">
            <button 
              onClick={pause}
              className="action-button pause"
            >
              ⏸
            </button>
            <button 
              onClick={end}
              className="action-button stop"
            >
              ⏹
            </button>
          </div>
        )}
        
        {state === 'paused' && (
          <div className="button-group">
            <button 
              onClick={resume}
              className="action-button resume"
            >
              ▶
            </button>
            <button 
              onClick={end}
              className="action-button stop"
            >
              ⏹
            </button>
          </div>
        )}
        
        {state === 'ended' && (
          <div className="completion-container">
            <div className="completion-card">
              <div className="completion-emoji">🏃‍♂️</div>
              <h2 className="completion-title">Workout Complete!</h2>
              <p className="completion-subtitle">Amazing job on your run</p>
              <div className="completion-stats">
                <div className="completion-distance">{formatDistanceWithBoth(stats.distanceMeters)}</div>
                <div className="completion-label">Total Distance</div>
              </div>
            </div>
            <button 
              onClick={discard}
              className="new-run-button"
            >
              <div className="button-icon">★</div>
              <div className="button-text">NEW RUN</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}