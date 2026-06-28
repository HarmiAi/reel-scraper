import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import SeoManager from './SeoManager.jsx';

const InstagramIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Dashboard = ({ navigate }) => {
  const mascotRef = useRef(null);

  useEffect(() => {
    const handleMascotTilt = (e) => {
      const mascot = mascotRef.current;
      if (!mascot) return;
      const rect = mascot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const tiltX = (e.clientX - centerX) / (window.innerWidth / 2);
      const tiltY = (e.clientY - centerY) / (window.innerHeight / 2);
      mascot.style.transform = `rotateX(${-tiltY * 16}deg) rotateY(${tiltX * 16}deg)`;
    };
    window.addEventListener('mousemove', handleMascotTilt);
    return () => window.removeEventListener('mousemove', handleMascotTilt);
  }, []);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "The Save Tube",
    "url": "https://thesavetube.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://thesavetube.com/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <motion.div
      key="dashboard-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <SeoManager 
        title="Free Instagram & Facebook Reel Downloader Online"
        description="Download Instagram Reels, Facebook Reels, and videos online for free. Save high-quality MP4 files directly to your device without watermarks."
        canonicalPath="/"
        schemaData={websiteSchema}
      />
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          Premium Hub Dashboard
        </div>
        
        <h1 className="hero-heading" style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.5rem)', lineHeight: 1.15, marginBottom: '0.4rem' }}>
          Download Reels From <br />
          <span className="text-gradient">Multiple Platforms</span>
        </h1>
        
        <p className="hero-subheading subtitle" style={{ marginBottom: '1rem', fontSize: '0.9rem', maxWidth: '480px' }}>
          Fast, secure, high-quality reel downloads. Choose a platform to begin.
        </p>

        {/* Mascot */}
        <div className="sculpture-wrapper">
          <div ref={mascotRef} className="sculpture-container">
            <div className="sculpture-ribbon-2" />
            <div className="sculpture-canister" />
            <div className="sculpture-rim">
              <div className="sculpture-lens" />
            </div>
            <div className="sculpture-ribbon-1" />
          </div>
        </div>
      </section>

      {/* Platform Cards Selection Grid */}
      <div className="platform-selection-grid">
        
        {/* Instagram Card */}
        <motion.div 
          className="clay-card platform-card instagram-hub-card spotlight-card"
          onClick={() => navigate('/instagram')}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="spotlight-glow" />
          
          <div className="platform-card-header">
            <div className="platform-icon-wrapper instagram-gradient">
              <InstagramIcon size={28} className="platform-brand-icon" />
            </div>
            <h2 className="platform-card-title">Instagram Reels</h2>
          </div>

          <p className="platform-card-desc">
            Save Instagram reels, IGTV, posts and stream metadata container directly via proxy.
          </p>

          <ul className="platform-features-list">
            <li>
              <ShieldCheck size={16} className="feature-tick" />
              <span>Download Reels</span>
            </li>
            <li>
              <Zap size={16} className="feature-tick" />
              <span>HD Quality Support</span>
            </li>
            <li>
              <Sparkles size={16} className="feature-tick" />
              <span>Creator Tools Support</span>
            </li>
          </ul>

          <button className="btn-clay btn-clay-primary platform-cta-btn">
            Open Downloader <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* Facebook Card */}
        <motion.div 
          className="clay-card platform-card facebook-hub-card spotlight-card"
          onClick={() => navigate('/facebook')}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="spotlight-glow" />

          <div className="platform-card-header">
            <div className="platform-icon-wrapper facebook-blue">
              <FacebookIcon size={28} className="platform-brand-icon" />
            </div>
            <h2 className="platform-card-title">Facebook Reels</h2>
          </div>

          <p className="platform-card-desc">
            Extract high-fidelity Facebook video streams and download original mp4 directly.
          </p>

          <ul className="platform-features-list">
            <li>
              <ShieldCheck size={16} className="feature-tick" />
              <span>Download Facebook Reels</span>
            </li>
            <li>
              <Zap size={16} className="feature-tick" />
              <span>HD Quality Support</span>
            </li>
            <li>
              <Sparkles size={16} className="feature-tick" />
              <span>Creator Tools Support</span>
            </li>
          </ul>

          <button className="btn-clay btn-clay-primary platform-cta-btn">
            Open Downloader <ArrowRight size={16} />
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
