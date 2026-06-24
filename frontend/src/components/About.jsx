import React from 'react';
import { ArrowLeft, Users, ShieldCheck, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const About = ({ navigate }) => {
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

      <div className="clay-card page-card">
        <h2 className="page-title text-gradient">About The Save Tube</h2>
        <p className="page-subtitle">
          The Save Tube is a state-of-the-art content toolkit engineered specifically for creators, editors, and social media professionals. We provide lossless stream extractions from social media platforms.
        </p>

        <div className="about-grid">
          <div className="about-item">
            <div className="feature-icon-clay">
              <Zap size={20} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To democratize content creation workflows by eliminating latency, compressing quality bottlenecks, and removing unnecessary subscription layers.
            </p>
          </div>

          <div className="about-item">
            <div className="feature-icon-clay">
              <Users size={20} />
            </div>
            <h3>Creator Focused</h3>
            <p>
              Built by product engineers who understand the speed required for dynamic editing workflows. Download raw content assets instantly.
            </p>
          </div>

          <div className="about-item">
            <div className="feature-icon-clay">
              <ShieldCheck size={20} />
            </div>
            <h3>High Standards of Security</h3>
            <p>
              We run all requests inside isolated sandboxes. We do not require credential logs, session storage trackers, or personal data tracking.
            </p>
          </div>

          <div className="about-item">
            <div className="feature-icon-clay">
              <Globe size={20} />
            </div>
            <h3>Decentralized Stack</h3>
            <p>
              Leveraging multi-region node endpoints to achieve near-instant server responses bypassing Instagram's local speed limits.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default About;
