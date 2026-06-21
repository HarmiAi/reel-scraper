import React from 'react';
import { AlertCircle, Lock, ShieldAlert, Ban, EyeOff, ArrowLeft } from 'lucide-react';

const ErrorState = ({ errorType, customMessage, onReset }) => {
  // Map error types to specific icons, titles, and descriptions
  const getErrorDetails = () => {
    switch (errorType) {
      case 'private_reel':
        return {
          icon: <Lock size={32} className="error-state-icon" />,
          title: 'Private Reel Detected',
          description: 'This video belongs to a private Instagram account. Lumina Reels cannot extract media from private accounts due to server access limitations and Instagram privacy controls.',
          actionLabel: 'Try Another Link'
        };
      case 'unsupported_url':
        return {
          icon: <Ban size={32} className="error-state-icon" />,
          title: 'Unsupported URL Source',
          description: 'Lumina Reels is strictly restricted to secure Instagram Reel, Post, or TV endpoints. TikTok, YouTube, and other external domains are rejected for security and compliance.',
          actionLabel: 'Try Instagram Link'
        };
      case 'rate_limited':
        return {
          icon: <ShieldAlert size={32} className="error-state-icon" />,
          title: 'Rate Limit Exceeded',
          description: 'Our backend sandbox clusters are currently under heavy load. Please wait a few seconds before trying again to prevent temporary access throttling.',
          actionLabel: 'Retry Extraction'
        };
      case 'reel_not_found':
        return {
          icon: <EyeOff size={32} className="error-state-icon" />,
          title: 'Reel Not Found (404)',
          description: 'The requested Instagram post could not be located. It may have been deleted by the owner, or there might be a typo in the URL path.',
          actionLabel: 'Verify URL and Try Again'
        };
      case 'invalid_url':
      default:
        return {
          icon: <AlertCircle size={32} className="error-state-icon" />,
          title: 'Invalid Instagram URL',
          description: customMessage || 'The URL format is invalid. Please verify the URL starts with https://instagram.com/ or https://www.instagram.com/ and references a /reel/, /p/, or /tv/ shortcode.',
          actionLabel: 'Check URL format'
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div className="error-state-wrapper">
      <div className="error-icon-clay">
        {details.icon}
      </div>
      <h3 className="error-title">{details.title}</h3>
      <p className="error-desc">{details.description}</p>
      
      <div className="btn-back-container" style={{ marginTop: '1.5rem' }}>
        <button className="btn-clay btn-clay-secondary" onClick={onReset} style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> {details.actionLabel}
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
