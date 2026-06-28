import React, { useState } from 'react';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import SeoManager from './SeoManager.jsx';

const TermsOfService = ({ navigate }) => {
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
        title="Terms of Service - The Save Tube"
        description="Read our terms of service and conditions of use. Learn about the rules, permissions, and copyright regulations for downloading media."
        canonicalPath="/terms-of-service"
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
            onClick={() => scrollToSection('fair-use', 'section1')}
          >
            <CheckCircle size={14} /> 1. Fair Use & Scope
          </button>
          <button 
            className={`policy-nav-btn ${activeSection === 'section2' ? 'active' : ''}`}
            onClick={() => scrollToSection('prohibited-actions', 'section2')}
          >
            <AlertTriangle size={14} /> 2. Prohibited Actions
          </button>
          <button 
            className={`policy-nav-btn ${activeSection === 'section3' ? 'active' : ''}`}
            onClick={() => scrollToSection('liability', 'section3')}
          >
            <AlertCircle size={14} /> 3. Liability Disclaimer
          </button>
          <button 
            className={`policy-nav-btn ${activeSection === 'section4' ? 'active' : ''}`}
            onClick={() => scrollToSection('revisions', 'section4')}
          >
            <RefreshCw size={14} /> 4. Term Revisions
          </button>
        </aside>

        {/* Documentation Content Card */}
        <article className="policy-doc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="feature-icon-clay" style={{ flexShrink: 0 }}><FileText size={22} /></div>
            <h2 className="page-title text-gradient" style={{ margin: 0 }}>Terms of Service</h2>
          </div>

          <div className="last-updated-badge">Last Updated: June 21, 2026</div>

          <div className="policy-content-body">
            <p>
              Welcome to The Save Tube. By accessing or using our streaming services, you agree to comply with and be bound by the following Terms of Service.
            </p>

            <h3 id="fair-use">1. Fair Use & Scope of Utility</h3>
            <p>
              The Save Tube is provided strictly as a creator utility tool to index and proxy media nodes that are already made available publically by content creators on Instagram.
            </p>
            <ul>
              <li>You may only download Reels, Posts, and TV files that belong to public accounts.</li>
              <li>You must respect copyright laws and intellectual property of the respective content creators.</li>
              <li>The Save Tube does not grant license rights for downloaded assets. Usage is subject to the content owner's explicit permissions.</li>
            </ul>

            <div className="policy-callout">
              <p>
                <strong>License Notice:</strong> The Save Tube is a streaming utility proxy and does not grant license rights. Respect creators' copyright at all times.
              </p>
            </div>

            <h3 id="prohibited-actions">2. Prohibited Actions</h3>
            <p>
              As a user of The Save Tube, you agree not to:
            </p>
            <ul>
              <li>Use the downloader to scrape media at an abusive scale that degrades our server nodes.</li>
              <li>Bypass rate-limiting configurations or run malicious scripts targeting the extraction endpoints.</li>
              <li>Incorporate the backend API into commercial, automated platforms without written developer consent.</li>
            </ul>

            <h3 id="liability">3. Disclaimer of Liability</h3>
            <p>
              The Save Tube is provided "as is" and "as available". We do not guarantee uninterrupted operational status or permanent compatibility with Instagram's private CDN schemas. We are not responsible for any copyright violations committed by users during download caching.
            </p>

            <h3 id="revisions">4. Term Revisions</h3>
            <p>
              We reserve the right to alter these terms at any time to align with platform API shifts. Continued use of the downloader constitutes your acceptance of updated regulations.
            </p>
          </div>
        </article>
      </div>
    </motion.div>
  );
};

export default TermsOfService;
