import React from 'react';
import { Sparkles } from 'lucide-react';

const Footer = ({ setCurrentPage, currentPage }) => {
  return (
    <footer className="footer-saas">
      <div className="footer-content">
        <div className="footer-brand" onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>
          <div className="logo-icon-clay">
            <Sparkles size={16} />
          </div>
          <span className="logo-text text-gradient">Lumina Reels</span>
        </div>
        <div className="footer-links-grid">
          <button 
            className={`footer-btn-link ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => { setCurrentPage('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            About Us
          </button>
          <button 
            className={`footer-btn-link ${currentPage === 'contact' ? 'active' : ''}`}
            onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Contact
          </button>
          <button 
            className={`footer-btn-link ${currentPage === 'privacy' ? 'active' : ''}`}
            onClick={() => { setCurrentPage('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Privacy Policy
          </button>
          <button 
            className={`footer-btn-link ${currentPage === 'terms' ? 'active' : ''}`}
            onClick={() => { setCurrentPage('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Terms of Service
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="copyright-text" style={{ fontSize: '0.85rem' }}>
          © 2026 Lumina Reels Creator Toolkit. Handcrafted with luxury minimalist aesthetics. All rights reserved.
        </p>
        <span className="footer-tagline">SaaS Creator Suite Concept</span>
      </div>
    </footer>
  );
};

export default Footer;
