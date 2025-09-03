import React, { useState } from 'react';

interface LegalDisclaimerProps {
  onAccept: () => void;
}

const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ onAccept }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const pages = [
    {
      title: "What FytS Fitness Is",
      content: (
        <div className="disclaimer-content">
          <h2>Movement Validation Protocol</h2>
          <p>FytS Fitness is a decentralized movement validation protocol that:</p>
          <ul>
            <li>Validates physical movement through GPS tracking</li>
            <li>Allocates FYTS tokens for protocol participation</li>
            <li>Contributes to a distributed validation network</li>
            <li>Operates as a utility protocol, not an investment platform</li>
          </ul>
          <h3>Protocol Participation</h3>
          <p>By participating in this protocol, you contribute computational validation to the network and receive token allocations as protocol incentives.</p>
        </div>
      )
    },
    {
      title: "Important Legal Notice",
      content: (
        <div className="disclaimer-content">
          <h2>Not a Financial Product</h2>
          <div className="warning-box">
            <p><strong>CRITICAL:</strong> FYTS tokens are NOT:</p>
            <ul>
              <li>Securities or investment contracts</li>
              <li>Promises of profit or financial return</li>
              <li>Backed by any government or institution</li>
              <li>Guaranteed to have or maintain any value</li>
            </ul>
          </div>
          <h3>Regulatory Compliance</h3>
          <p>This protocol operates as a utility system. Token allocations are solely for participation in the validation network. Any market value is secondary and not promised or guaranteed.</p>
          <p>You acknowledge that you are not purchasing FYTS tokens as an investment and have no expectation of profit from the efforts of others.</p>
        </div>
      )
    },
    {
      title: "Health & Safety Guidelines",
      content: (
        <div className="disclaimer-content">
          <h2>Physical Activity Warning</h2>
          <div className="warning-box">
            <p><strong>HEALTH WARNING:</strong> Consult your physician before beginning any exercise program.</p>
          </div>
          <ul>
            <li>Start slowly and increase intensity gradually</li>
            <li>Stay hydrated during physical activity</li>
            <li>Stop immediately if you feel pain or discomfort</li>
            <li>Do not exceed your physical limitations</li>
            <li>Never sacrifice safety for token allocations</li>
          </ul>
          <h3>Your Responsibility</h3>
          <p>You are solely responsible for your health and safety. The protocol does not provide medical advice or fitness guidance.</p>
        </div>
      )
    },
    {
      title: "Terms of Service",
      content: (
        <div className="disclaimer-content">
          <h2>Agreement to Terms</h2>
          <p>By using this protocol, you agree that:</p>
          <ul>
            <li>You are at least 18 years of age</li>
            <li>You will not manipulate or falsify movement data</li>
            <li>You understand tokens have no guaranteed value</li>
            <li>You will comply with all applicable laws</li>
            <li>You will not use the protocol for illegal purposes</li>
          </ul>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="terms-checkbox">
              I have read, understood, and agree to all terms and conditions
            </label>
          </div>
        </div>
      )
    }
  ];

  const currentPageData = pages[currentPage - 1];

  return (
    <div className="legal-overlay">
      <div className="legal-modal">
        <div className="legal-header">
          <h1>FytS Fitness Protocol Agreement</h1>
          <div className="page-indicator">Step {currentPage} of {pages.length}</div>
        </div>
        
        <div className="legal-content">
          {currentPageData.content}
        </div>
        
        <div className="legal-footer">
          <button
            className="legal-nav-button"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {currentPage < pages.length ? (
            <button
              className="legal-next-button"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="legal-accept-button"
              onClick={onAccept}
              disabled={!termsAccepted}
            >
              Accept & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;