import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import AdPlaceholder from './AdPlaceholder.jsx';
import { rewardedAdService } from '../services/rewardedAdService.js';

const UnlockModal = ({ isOpen, onClose, onUnlock, qualityName }) => {
  const [countdown, setCountdown] = useState(3);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(3);
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

  return (
    <div className="modal-overlay-saas">
      <div className="clay-card modal-card-saas">
        <button className="modal-close-saas" onClick={onClose} aria-label="Close Modal">
          <X size={18} />
        </button>

        <div className="modal-header-saas">
          <h3 className="modal-title-saas">Unlocking {qualityName} Quality</h3>
          <p className="modal-desc-saas">
            Lumina is free. Premium bandwidth downloads (HD / Best) are sponsored by quick, secure ads.
          </p>
        </div>

        <div className="modal-body-saas">
          <AdPlaceholder countdown={countdown} />
        </div>

        <div className="modal-footer-saas">
          {isUnlocked ? (
            <button 
              className="btn-clay btn-clay-primary modal-action-btn"
              onClick={onUnlock}
            >
              <ShieldCheck size={18} /> Download Now (Lossless)
            </button>
          ) : (
            <button 
              className="btn-clay btn-clay-secondary modal-action-btn"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed', width: '100%' }}
            >
              Unlocking in {countdown}s...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;
