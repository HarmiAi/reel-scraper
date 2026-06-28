import React, { useState } from 'react';
import { ArrowLeft, Shield, EyeOff, Cpu, Info, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import SeoManager from './SeoManager.jsx';

const PrivacyPolicy = ({ navigate }) => {
  const [activeSection, setActiveSection] = useState('section1');

  const scrollToSection = (id, sectionKey) => {
    setActiveSection(sectionKey);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
    >
      <SeoManager 
        title="Privacy Policy - The Save Tube"
        description="Read our privacy policy to understand how we collect, protect, and handle your data. The Save Tube values user security and data privacy."
        canonicalPath="/privacy-policy"
      />
      <div className="btn-back-container" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>
        <button className="btn-back btn-clay btn-clay-secondary" style={{ height: '36px', padding: '0 16px', borderRadius: 'var(--radius-full)' }} onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      <div className="policy-split-container">
        {/* Sticky Sidebar Navigation */}
        <aside className="policy-sidebar">
          <span className="policy-sidebar-title">Sections</span>
          <button 
            className={`policy-nav-btn ${activeSection === 'section1' ? 'active' : ''}`}
            onClick={() => scrollToSection('zero-collection', 'section1')}
          >
            <EyeOff size={14} /> 1. Data Collection
          </button>
          <button 
            className={`policy-nav-btn ${activeSection === 'section2' ? 'active' : ''}`}
            onClick={() => scrollToSection('stream-processing', 'section2')}
          >
            <Cpu size={14} /> 2. Stream Processing
          </button>
          <button 
            className={`policy-nav-btn ${activeSection === 'section3' ? 'active' : ''}`}
            onClick={() => scrollToSection('external-nodes', 'section3')}
          >
            <Info size={14} /> 3. API Nodes
          </button>
          <button 
            className={`policy-nav-btn ${activeSection === 'section4' ? 'active' : ''}`}
            onClick={() => scrollToSection('age-protection', 'section4')}
          >
            <HelpCircle size={14} /> 4. Age Protection
          </button>
        </aside>

        {/* Documentation Content Card */}
        <article className="policy-doc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="feature-icon-clay" style={{ flexShrink: 0 }}><Shield size={22} /></div>
            <h2 className="page-title text-gradient" style={{ margin: 0 }}>Privacy Policy</h2>
          </div>

          <div className="last-updated-badge">Last Updated: June 21, 2026</div>

          <div className="policy-content-body">
            <p>
              At The Save Tube, we are dedicated to protecting your privacy and ensuring a transparent, secure environment. This Privacy Policy details the complete absence of data collection logs and the measures we employ to secure users.
            </p>

            <h3 id="zero-collection">1. Zero Data Collection Architecture</h3>
            <p>
              The Save Tube operates as a completely anonymous utility:
            </p>
            <ul>
              <li>We do <strong>not</strong> collect, harvest, or log any personal credentials or accounts.</li>
              <li>We do <strong>not</strong> save download history on our servers. Your download log is stored strictly on your local browser machine via `localStorage`.</li>
              <li>We do <strong>not</strong> install cookies, tracking pixels, or cross-site advertisement analytics.</li>
            </ul>

            <div className="policy-callout">
              <p>
                <strong>Privacy Statement:</strong> Your download footprint is completely local to your browser machine. No logs are sent back to our servers.
              </p>
            </div>

            <h3 id="stream-processing">2. Node Stream Processing</h3>
            <p>
              When you request a download, our server spin-up sandboxes communicate directly with Instagram's CDN servers. The raw video files are piped through memory streams directly back to your browser client. No cached files persist on our storage nodes after the transfer finishes.
            </p>

            <h3 id="external-nodes">3. External Platform API Nodes</h3>
            <p>
              The Save Tube is independent and has no official relationship with Instagram, Meta Inc., TikTok, or YouTube. When downloading public reels, you are interacting directly with official Instagram CDN servers.
            </p>

            <h3 id="age-protection">4. Safety & Age Protection</h3>
            <p>
              The Save Tube is intended for creator utility. Because no data is collected, we do not monitor or maintain information about individual age brackets.
            </p>
          </div>
        </article>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
