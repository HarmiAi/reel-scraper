import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check } from 'lucide-react';
import AdPlaceholder from './AdPlaceholder.jsx';
import { rewardedAdService } from '../services/rewardedAdService.js';

const UnlockModal = ({ isOpen, onClose, onUnlock, onUnlockComplete, qualityName }) => {
  const [countdown, setCountdown] = useState(5);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset states on open
    setCountdown(5);
    setIsUnlocked(false);

    // Initialize and preload the rewarded ad stub
    rewardedAdService.initialize();
    rewardedAdService.preloadAd();

    // Display the ad and listen to loaded events
    rewardedAdService.showAd({
      onAdLoaded: () => {
        console.log('[Ad Service] Ad is successfully rendering.');
      }
    });

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handles starting the download using existing platform downloader logic
  const handleDownloadClick = () => {
    if (onUnlock) {
      onUnlock();
    } else if (onUnlockComplete) {
      onUnlockComplete();
    }
  };

  const displayQuality = (qualityName === 'High' || qualityName === 'BEST') ? 'Best' : 'HD';

  return (
    <div className="modal-overlay-saas">
      <div className="clay-card modal-card-saas">
        {/* Close Button */}
        <button className="modal-close-saas" onClick={onClose} aria-label="Close Modal">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="modal-header-saas">
          <h3 className="modal-title-saas" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary-color)' }} />
            Unlocking {displayQuality} Quality
          </h3>
          <p className="modal-desc-saas">
            The Save Tube is free. Premium bandwidth downloads ({displayQuality}) are unlocked after a quick countdown.
          </p>
        </div>

        {/* Modal Body / Dynamic Switch */}
        <div className="modal-body-saas">
          {!isUnlocked ? (
            <AdPlaceholder countdown={countdown} qualityName={qualityName} />
          ) : (
            <div className="unlock-success-layout">
              <div className="unlock-success-icon">
                <Check size={32} />
              </div>
              <h4 className="unlock-success-title">Download Ready!</h4>
              <p className="unlock-success-desc">
                Your high-fidelity {displayQuality} video stream has been prepared successfully.
              </p>
              
              <button 
                className="btn-clay btn-clay-primary unlock-large-btn"
                onClick={handleDownloadClick}
              >
                <ShieldCheck size={18} /> Download Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;
