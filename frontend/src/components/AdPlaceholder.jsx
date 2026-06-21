import React from 'react';
import { Sparkles, Play } from 'lucide-react';

const AdPlaceholder = ({ countdown }) => {
  return (
    <div className="ad-placeholder-container">
      <div className="ad-header">
        <span className="ad-badge">Sponsor Ad</span>
        <span className="ad-timer">Unlocking in {countdown}s...</span>
      </div>
      <div className="ad-body pulsing-skeleton">
        <div className="ad-video-mock">
          <Play size={24} className="ad-play-icon" />
          <div className="ad-video-overlay">
            <span className="ad-brand">Lumina Premium Creator Suite</span>
            <span className="ad-cta">Boost your social media presence with AI</span>
          </div>
        </div>
      </div>
      <div className="ad-footer">
        <div className="ad-progress-bar">
          <div 
            className="ad-progress-fill" 
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdPlaceholder;
