import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const TermsOfService = ({ navigate }) => {
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
          <div className="feature-icon-clay" style={{ flexShrink: 0 }}><FileText size={22} /></div>
          <h2 className="page-title text-gradient" style={{ margin: 0 }}>Terms of Service</h2>
        </div>
        
        <div className="policy-content">
          <p className="last-updated">Last Updated: June 21, 2026</p>
          
          <p>
            Welcome to Lumina Reels. By accessing or using our streaming services, you agree to comply with and be bound by the following Terms of Service.
          </p>

          <h3>1. Fair Use & Scope of Utility</h3>
          <p>
            Lumina Reels is provided strictly as a creator utility tool to index and proxy media nodes that are already made available publically by content creators on Instagram.
          </p>
          <ul>
            <li>You may only download Reels, Posts, and TV files that belong to public accounts.</li>
            <li>You must respect copyright laws and intellectual property of the respective content creators.</li>
            <li>Lumina Reels does not grant license rights for downloaded assets. Usage is subject to the content owner's explicit permissions.</li>
          </ul>

          <h3>2. Prohibited Actions</h3>
          <p>
            As a user of Lumina Reels, you agree not to:
          </p>
          <ul>
            <li>Use the downloader to scrape media at an abusive scale that degrades our server nodes.</li>
            <li>Bypass rate-limiting configurations or run malicious scripts targeting the extraction endpoints.</li>
            <li>Incorporate the backend API into commercial, automated platforms without written developer consent.</li>
          </ul>

          <h3>3. Disclaimer of Liability</h3>
          <p>
            Lumina Reels is provided "as is" and "as available". We do not guarantee uninterrupted operational status or permanent compatibility with Instagram's private CDN schemas. We are not responsible for any copyright violations committed by users during download caching.
          </p>

          <h3>4. Term Revisions</h3>
          <p>
            We reserve the right to alter these terms at any time to align with platform API shifts. Continued use of the downloader constitutes your acceptance of updated regulations.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TermsOfService;
