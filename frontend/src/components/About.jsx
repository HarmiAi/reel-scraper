import React from 'react';
import { ArrowLeft, Users, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import SeoManager from './SeoManager.jsx';

const About = ({ navigate }) => {
  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Card fade-in animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://thesavetube.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "About Us",
        "item": "https://thesavetube.com/about"
      }
    ]
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
        title="About The Save Tube - Our Mission & Story"
        description="Learn more about The Save Tube, our free high-speed video downloader tool, and our mission to provide clean, ad-free online media extraction services."
        canonicalPath="/about"
        schemaData={breadcrumbSchema}
      />
      <div className="btn-back-container" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>
        <button className="btn-back btn-clay btn-clay-secondary" style={{ height: '36px', padding: '0 16px', borderRadius: 'var(--radius-full)' }} onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      <div className="page-card">
        {/* Header Section */}
        <div className="about-header-section">
          <div className="about-badge">
            <span className="about-badge-dot"></span>
            <Sparkles size={12} style={{ color: 'var(--primary-color)' }} />
            Creator Toolkit
          </div>
          <h2 className="page-title text-gradient">About The Save Tube</h2>
        </div>

        {/* Intro Split Section */}
        <div className="about-intro-grid">
          <div className="about-intro-text">
            <p>
              The Save Tube is a state-of-the-art content toolkit engineered specifically for creators, editors, and social media professionals. We provide lossless stream extractions from social media platforms.
            </p>
          </div>
          <div className="about-intro-graphic">
            <div className="about-circle-decor">
              <div className="about-circle-inner">
                <Sparkles size={48} className="ad-play-icon" style={{ animation: 'pulse 2s infinite ease-in-out' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Features Stagger Grid */}
        <motion.div 
          className="about-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="about-item-card" variants={itemVariants}>
            <div className="feature-icon-clay">
              <Zap size={20} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To democratize content creation workflows by eliminating latency, compressing quality bottlenecks, and removing unnecessary subscription layers.
            </p>
          </motion.div>

          <motion.div className="about-item-card" variants={itemVariants}>
            <div className="feature-icon-clay">
              <Users size={20} />
            </div>
            <h3>Creator Focused</h3>
            <p>
              Built by product engineers who understand the speed required for dynamic editing workflows. Download raw content assets instantly.
            </p>
          </motion.div>

          <motion.div className="about-item-card" variants={itemVariants}>
            <div className="feature-icon-clay">
              <ShieldCheck size={20} />
            </div>
            <h3>High Standards of Security</h3>
            <p>
              We run all requests inside isolated sandboxes. We do not require credential logs, session storage trackers, or personal data tracking.
            </p>
          </motion.div>

          <motion.div className="about-item-card" variants={itemVariants}>
            <div className="feature-icon-clay">
              <Globe size={20} />
            </div>
            <h3>Decentralized Stack</h3>
            <p>
              Leveraging multi-region node endpoints to achieve near-instant server responses bypassing Instagram's local speed limits.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default About;
