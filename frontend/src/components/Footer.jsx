import React from 'react';
import { Sparkles } from 'lucide-react';

const Footer = ({ navigate, currentPath }) => {
  return (
    <footer className="footer-saas">
      <div className="footer-content">
        <div className="footer-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon-clay">
            <Sparkles size={16} />
          </div>
          <span className="logo-text text-gradient">The Save Tube</span>
        </div>
        <div className="footer-links-grid">
          <button 
            className={`footer-btn-link ${currentPath === '/about' ? 'active' : ''}`}
            onClick={() => navigate('/about')}
          >
            About Us
          </button>
          <button 
            className={`footer-btn-link ${currentPath === '/contact' ? 'active' : ''}`}
            onClick={() => navigate('/contact')}
          >
            Contact
          </button>
          <button 
            className={`footer-btn-link ${currentPath === '/privacy' ? 'active' : ''}`}
            onClick={() => navigate('/privacy')}
          >
            Privacy Policy
          </button>
          <button 
            className={`footer-btn-link ${currentPath === '/terms' ? 'active' : ''}`}
            onClick={() => navigate('/terms')}
          >
            Terms of Service
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="copyright-text" style={{ fontSize: '0.85rem' }}>
          © 2026 The Save Tube Creator Toolkit. Handcrafted with luxury minimalist aesthetics. All rights reserved.
        </p>
        <span className="footer-tagline">SaaS Creator Suite Concept</span>
      </div>
    </footer>
  );
};

export default Footer;
