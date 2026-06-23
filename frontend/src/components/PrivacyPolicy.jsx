import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const PrivacyPolicy = ({ navigate }) => {
  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
    >
      <div className="btn-back-container" style={{ alignSelf: 'flex-start', marginBottom: '2rem' }}>
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="clay-card page-card terms-privacy-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="feature-icon-clay" style={{ flexShrink: 0 }}><Shield size={22} /></div>
          <h2 className="page-title text-gradient" style={{ margin: 0 }}>Privacy Policy</h2>
        </div>
        
        <div className="policy-content">
          <p className="last-updated">Last Updated: June 21, 2026</p>
          
          <p>
            At Lumina Reels, we are dedicated to protecting your privacy and ensuring a transparent, secure environment. This Privacy Policy details the complete absence of data collection logs and the measures we employ to secure users.
          </p>

          <h3>1. Zero Data Collection Architecture</h3>
          <p>
            Lumina Reels operates as a completely anonymous utility:
          </p>
          <ul>
            <li>We do <strong>not</strong> collect, harvest, or log any personal credentials or accounts.</li>
            <li>We do <strong>not</strong> save download history on our servers. Your download log is stored strictly on your local browser machine via `localStorage`.</li>
            <li>We do <strong>not</strong> install cookies, tracking pixels, or cross-site advertisement analytics.</li>
          </ul>

          <h3>2. Node Stream Processing</h3>
          <p>
            When you request a download, our server spin-up sandboxes communicate directly with Instagram's CDN servers. The raw video files are piped through memory streams directly back to your browser client. No cached files persist on our storage nodes after the transfer finishes.
          </p>

          <h3>3. External Platform API Nodes</h3>
          <p>
            Lumina Reels is independent and has no official relationship with Instagram, Meta Inc., TikTok, or YouTube. When downloading public reels, you are interacting directly with official Instagram CDN servers.
          </p>

          <h3>4. Safety & Age Protection</h3>
          <p>
            Lumina Reels is intended for creator utility. Because no data is collected, we do not monitor or maintain information about individual age brackets.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
