import React from 'react';
import { Play } from 'lucide-react';

const AdPlaceholder = ({ countdown, qualityName }) => {
  // Format quality name dynamically
  const displayQuality = (qualityName === 'High' || qualityName === 'BEST') ? 'Best' : 'HD';

  return (
    <div className="ad-placeholder-container">
      <div className="ad-header">
        <span className="ad-badge">Sponsor Content</span>
        <span className="ad-timer">Unlocking in {countdown}s...</span>
      </div>
      
      <div className="ad-body">
        <div className="ad-video-mock">
          <Play size={28} className="ad-play-icon" />
          <div className="ad-video-overlay">
            <span className="ad-brand">The Save Tube Premium Suite</span>
            <span className="ad-cta">Boost your social media presence with high-fidelity assets</span>
          </div>
        </div>
      </div>

      <div className="ad-footer">
        <div className="ad-progress-bar">
          <div 
            className="ad-progress-fill" 
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>
        <div className="ad-preparing-txt">
          <div className="loader-circle-glow" />
          <span>Preparing your {displayQuality} download...</span>
        </div>
      </div>
    </div>
  );
};

export default AdPlaceholder;
