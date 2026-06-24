import React from 'react';
import { ShieldCheck, ArrowLeft, History, Share2, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FALLBACK_THUMBNAIL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%231a1a24"/><g fill="none" stroke="%233f3f56" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(170, 270)"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><path d="M7 2h10M5 22h14M12 18v-4M9 14h6"/></g><text x="50%" y="55%" font-family="sans-serif" font-size="14" fill="%236b6b83" dominant-baseline="middle" text-anchor="middle">Preview Unavailable</text></svg>`;


const DownloadSuccessScreen = ({ reelData, onReset, onViewHistory, onShareApp, qualityName }) => {
  return (
    <motion.div 
      className="success-screen-container"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
    >
      <div className="success-icon-header">
        <div className="success-tick-clay">
          <CheckCircle size={32} />
        </div>
        <h3 className="success-screen-title text-gradient">Download Initialized!</h3>
        <p className="success-screen-desc">
          Your browser has requested the raw video stream container. The file will save directly inside your device's <strong>Downloads</strong> folder.
        </p>
      </div>

      <div className="clay-card success-preview-card">
        <div className="success-preview-layout">
          <img 
            src={reelData.thumbnailUrl} 
            alt="Reel Cover" 
            className="success-preview-thumb" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_THUMBNAIL;
            }}
          />
          <div className="success-preview-meta">
            <span className="success-preview-user">@{reelData.username}</span>
            <span className="success-preview-badge">{qualityName} Quality</span>
            <p className="success-preview-caption">
              {reelData.caption ? (
                reelData.caption.length > 90 
                  ? `${reelData.caption.substring(0, 90)}...` 
                  : reelData.caption
              ) : 'Enjoy this public Instagram reel.'}
            </p>
          </div>
        </div>
      </div>

      <div className="success-screen-actions">
        <button className="btn-clay btn-clay-primary success-action-btn" onClick={onReset} style={{ width: '100%' }}>
          <ArrowLeft size={16} /> Download Another Reel
        </button>

        <div className="success-options-grid">
          <button className="btn-clay btn-clay-secondary success-option-btn" onClick={onViewHistory}>
            <History size={16} /> View History
          </button>
          
          <button className="btn-clay btn-clay-secondary success-option-btn" onClick={onShareApp}>
            <Share2 size={16} /> Share The Save Tube
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DownloadSuccessScreen;
