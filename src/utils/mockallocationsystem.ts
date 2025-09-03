.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #111827, #374151, #000000);
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

.background-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.header {
  padding: 3rem 1.5rem 2rem;
  text-align: center;
  position: relative;
  z-index: 10;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.logo {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #f97316, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 900;
  color: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
}

.logo::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: linear-gradient(135deg, #f97316, #ec4899);
  border-radius: 50%;
  opacity: 0.75;
  filter: blur(8px);
  animation: pulse 2s infinite;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #f97316, #ec4899, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
  margin: 0;
}

.protocol-subtitle {
  color: #9ca3af;
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Main Navigation */
.main-navigation {
  display: flex;
  gap: 0.5rem;
  padding: 0 1.5rem 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-tab {
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.nav-tab.active {
  background: linear-gradient(135deg, #f97316, #ec4899);
  color: white;
  border-color: transparent;
  transform: scale(1.05);
}

.nav-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Wallet Section */
.wallet-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border-radius: 1rem;
  padding: 1rem;
  margin: 1rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.wallet-section h3 {
  color: #fbbf24;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.network-description {
  color: #d1d5db;
  font-size: 0.875rem;
  text-align: center;
  margin: 0.5rem 0 1rem;
  line-height: 1.4;
}

.connect-wallet-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin: 0.25rem;
}

.connect-wallet-btn:hover {
  transform: scale(1.05);
}

.connect-wallet-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
}

.wallet-connected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.wallet-info {
  text-align: left;
}

.network-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.wallet-address {
  color: #10b981;
  font-weight: 600;
  font-family: monospace;
}

.disconnect-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
}

/* Admin Management */
.admin-management {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 0.75rem;
}

.admin-management h4 {
  color: #fbbf24;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-management h5 {
  color: #fbbf24;
  font-size: 0.75rem;
  margin: 0.75rem 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.add-admin-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.admin-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: white;
  font-family: monospace;
  font-size: 0.875rem;
}

.admin-input::placeholder {
  color: #9ca3af;
}

.admin-btn {
  background: linear-gradient(135deg, #374151, #4b5563);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.admin-btn:hover {
  transform: scale(1.05);
}

.admin-btn.add-admin {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.admin-btn.confirm {
  background: linear-gradient(135deg, #10b981, #059669);
}

.admin-btn.remove {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  padding: 0.25rem 0.5rem;
  font-size: 0.625rem;
}

.admin-btn.emergency {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.admin-btn.standard {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.admin-list {
  margin-top: 0.75rem;
}

.admin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.admin-address {
  font-family: monospace;
  color: #d1d5db;
  font-size: 0.875rem;
}

.admin-controls {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.75rem;
}

.admin-controls h4 {
  color: #8b5cf6;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Motivation */
.motivation-container {
  padding: 0 1.5rem 1.5rem;
  position: relative;
  z-index: 10;
}

.motivation-quote {
  background: rgba(255, 215, 0, 0.1);
  backdrop-filter: blur(16px);
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 215, 0, 0.2);
  text-align: center;
  color: #fbbf24;
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.4;
  animation: slideIn 1s ease-in-out;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Status */
.status-container {
  padding: 0 1.5rem 1.5rem;
  position: relative;
  z-index: 10;
}

.status-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.status-dot.running {
  background: #10b981;
  animation: pulse 2s infinite;
}

.status-dot.paused {
  background: #f59e0b;
}

.status-dot.stationary {
  background: #f97316;
  animation: pulse 2s infinite;
}

.status-dot.ended {
  background: #3b82f6;
}

.status-dot.idle {
  background: #6b7280;
}

.status-text {
  font-size: 1.125rem;
  font-weight: 600;
}

.gps-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.875rem;
}

.gps-dots {
  display: flex;
  gap: 0.25rem;
}

.gps-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #10b981;
  border-radius: 50%;
}

.stationary-notice {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(249, 115, 22, 0.1);
  border-radius: 0.75rem;
  border: 1px solid rgba(249, 115, 22, 0.2);
  color: #fed7aa;
  text-align: center;
  font-size: 0.875rem;
}

/* Distance */
.distance-container {
  padding: 0 1.5rem 2rem;
  text-align: center;
  position: relative;
  z-index: 10;
}

.distance-value {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.05em;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.distance-label {
  font-size: 1.125rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Stats Grid */
.stats-grid {
  padding: 0 1.5rem 2rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  position: relative;
  z-index: 10;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-value.blue {
  color: #60a5fa;
}

.stat-value.purple {
  color: #a78bfa;
}

.stat-value.orange {
  color: #fb923c;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Action Container */
.action-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.5rem 3rem;
  position: relative;
  z-index: 10;
}

.start-button {
  width: 12rem;
  height: 12rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  border: none;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: transform 0.3s ease;
  position: relative;
}

.start-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  animation: pulse 2s infinite;
  opacity: 0.7;
}

.start-button:hover {
  transform: scale(1.05);
}

.button-group {
  display: flex;
  gap: 1.5rem;
}

.action-button {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.action-button:hover {
  transform: scale(1.1);
}

.action-button.pause {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.action-button.stop {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.action-button.resume {
  background: linear-gradient(135deg, #10b981, #059669);
}

.button-icon {
  font-size: 3rem;
  margin-bottom: 0.25rem;
}

.button-text {
  font-size: 1.5rem;
  font-weight: 700;
}

.button-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

/* Completion */
.completion-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.completion-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.completion-emoji {
  font-size: 3.75rem;
  margin-bottom: 1rem;
}

.completion-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.completion-subtitle {
  font-size: 1.125rem;
  color: #bfdbfe;
  margin: 0 0 1rem;
}

.completion-stats {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(8px);
}

.completion-distance {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
}

.completion-label {
  font-size: 0.875rem;
  color: #9ca3af;
}

.network-contribution {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 0.75rem;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.network-text {
  color: #6ee7b7;
  font-size: 0.875rem;
  margin: 0;
  text-align: center;
}

.new-run-button {
  width: 8rem;
  height: 8rem;
  background: linear-gradient(135deg, #4b5563, #374151);
  border-radius: 50%;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
}

.new-run-button:hover {
  transform: scale(1.05);
}

/* Legal Disclaimer */
.legal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #111827, #374151, #000000);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.legal-modal {
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.legal-header {
  padding: 2rem;
  background: linear-gradient(135deg, #f97316, #ec4899);
  color: white;
}

.legal-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.page-indicator {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.legal-content {
  padding: 2rem;
  color: white;
  overflow-y: auto;
  max-height: calc(80vh - 200px);
}

.disclaimer-content {
  line-height: 1.6;
}

.disclaimer-content h2 {
  color: #10b981;
  margin-top: 0;
  margin-bottom: 1rem;
}

.disclaimer-content h3 {
  color: #60a5fa;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.disclaimer-content ul {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.disclaimer-content li {
  margin: 0.5rem 0;
}

.warning-box {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
}

.warning-box p {
  margin: 0.5rem 0;
}

.checkbox-container {
  margin-top: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.checkbox-container input {
  margin-top: 0.25rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-container label {
  cursor: pointer;
  color: #fbbf24;
  font-weight: 600;
}

.legal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legal-nav-button {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.legal-nav-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

.legal-next-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.legal-accept-button {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
}

.legal-accept-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}