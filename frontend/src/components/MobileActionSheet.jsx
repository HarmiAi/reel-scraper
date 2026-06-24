import React from 'react';
import { Download, FileText, Sparkles, Share2, X, History } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileActionSheet = ({ isOpen, onClose, reelData, onDownloadClick, onCopyCaption, onCopyHashtags, onShareClick, onViewHistory }) => {
  if (!isOpen || !reelData) return null;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <motion.div 
        className="sheet-container"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div className="sheet-creator">
            <img src={reelData.avatarUrl} alt="" className="sheet-avatar" />
            <div className="sheet-creator-meta">
              <span className="sheet-username">@{reelData.username}</span>
              <span className="sheet-tagline">Instagram Reel Stream</span>
            </div>
          </div>
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close Actions">
            <X size={18} />
          </button>
        </div>

        <div className="sheet-caption-preview">
          {reelData.caption ? (
            reelData.caption.length > 80 
              ? `${reelData.caption.substring(0, 80)}...` 
              : reelData.caption
          ) : 'Enjoy this public Instagram reel. ✨'}
        </div>

        <div className="sheet-actions-list">
          <button 
            className="sheet-action-item" 
            onClick={() => {
              onDownloadClick();
              onClose();
            }}
          >
            <div className="sheet-action-icon-clay">
              <Download size={18} />
            </div>
            <div className="sheet-action-details">
              <span className="sheet-action-title">Download Video File</span>
              <span className="sheet-action-sub">HD & SD Quality configurations</span>
            </div>
          </button>

          <button 
            className="sheet-action-item" 
            onClick={() => {
              onCopyCaption();
              onClose();
            }}
          >
            <div className="sheet-action-icon-clay">
              <FileText size={18} />
            </div>
            <div className="sheet-action-details">
              <span className="sheet-action-title">Copy Caption</span>
              <span className="sheet-action-sub">Save caption to clipboard</span>
            </div>
          </button>

          <button 
            className="sheet-action-item" 
            onClick={() => {
              onCopyHashtags();
              onClose();
            }}
          >
            <div className="sheet-action-icon-clay">
              <Sparkles size={18} />
            </div>
            <div className="sheet-action-details">
              <span className="sheet-action-title">Copy Hashtags</span>
              <span className="sheet-action-sub">Extract hashtags dynamically</span>
            </div>
          </button>

          <button 
            className="sheet-action-item" 
            onClick={() => {
              onShareClick();
              onClose();
            }}
          >
            <div className="sheet-action-icon-clay">
              <Share2 size={18} />
            </div>
            <div className="sheet-action-details">
              <span className="sheet-action-title">Share Reel link</span>
              <span className="sheet-action-sub">Copy sharing link for The Save Tube</span>
            </div>
          </button>

          <button 
            className="sheet-action-item" 
            onClick={() => {
              onViewHistory();
              onClose();
            }}
          >
            <div className="sheet-action-icon-clay">
              <History size={18} />
            </div>
            <div className="sheet-action-details">
              <span className="sheet-action-title">View History Log</span>
              <span className="sheet-action-sub">Scroll to local downloads</span>
            </div>
          </button>
        </div>

        <button className="btn-clay btn-clay-secondary sheet-cancel-btn" onClick={onClose}>
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

export default MobileActionSheet;
