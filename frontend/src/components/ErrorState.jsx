import React from 'react';
import { AlertCircle, Lock, ShieldAlert, Ban, EyeOff, ArrowLeft } from 'lucide-react';

const ErrorState = ({ errorType, customMessage, onReset, platform = 'instagram' }) => {
  const isFb = platform === 'facebook';

  // Map error types to specific icons, titles, and descriptions
  const getErrorDetails = () => {
    switch (errorType) {
      case 'private_reel':
        return {
          icon: <Lock size={32} className="error-state-icon" />,
          title: isFb ? 'Private Facebook Video Detected' : 'Private Reel Detected',
          description: isFb 
            ? 'This video belongs to a private Facebook profile or group. The Save Tube cannot extract media from private accounts due to privacy settings and access limitations.'
            : 'This video belongs to a private Instagram account. The Save Tube cannot extract media from private accounts due to server access limitations and Instagram privacy controls.',
          actionLabel: 'Try Another Link'
        };
      case 'unsupported_url':
        return {
          icon: <Ban size={32} className="error-state-icon" />,
          title: 'Unsupported URL Source',
          description: isFb
            ? 'The Save Tube is strictly restricted to secure Facebook Reel or Video endpoints. TikTok, YouTube, and other external domains are rejected for security and compliance.'
            : 'The Save Tube is strictly restricted to secure Instagram Reel, Post, or TV endpoints. TikTok, YouTube, and other external domains are rejected for security and compliance.',
          actionLabel: isFb ? 'Try Facebook Link' : 'Try Instagram Link'
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
          title: isFb ? 'Facebook Video Not Found (404)' : 'Reel Not Found (404)',
          description: isFb
            ? 'The requested Facebook video or reel could not be located. It may have been deleted by the owner, or there might be a typo in the URL path.'
            : 'The requested Instagram post could not be located. It may have been deleted by the owner, or there might be a typo in the URL path.',
          actionLabel: 'Verify URL and Try Again'
        };
      case 'extraction_failed':
        return {
          icon: <AlertCircle size={32} className="error-state-icon" />,
          title: 'Extraction Failed',
          description: customMessage || 'Unable to extract the video stream. Please confirm the link is public, accessible, and try again.',
          actionLabel: 'Try Again'
        };
      case 'invalid_url':
      default:
        return {
          icon: <AlertCircle size={32} className="error-state-icon" />,
          title: isFb ? 'Invalid Facebook URL' : 'Invalid Instagram URL',
          description: customMessage || (isFb
            ? 'The URL format is invalid. Please verify the URL points to a public Facebook reel or video (e.g. facebook.com, fb.watch, fb.com).'
            : 'The URL format is invalid. Please verify the URL starts with https://instagram.com/ or https://www.instagram.com/ and references a /reel/, /p/, or /tv/ shortcode.'),
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
