import React from 'react';
import { Clipboard, Sparkles, DownloadCloud } from 'lucide-react';

const HowItWorks = () => {
  return (
    <section className="how-it-works-section">
      <h2 className="how-it-works-heading">How The Save Tube Works</h2>
      <p className="how-it-works-subheading">
        Extracting premium social media assets takes three simple, secure steps.
      </p>
      
      <div className="steps-grid">
        <div className="clay-card step-card">
          <div className="step-number">01</div>
          <div className="step-icon-clay">
            <Clipboard size={22} />
          </div>
          <h3 className="step-title">Paste Video URL</h3>
          <p className="step-desc">
            Copy the public video or reel link and paste it in the secure input above.
          </p>
        </div>

        <div className="clay-card step-card">
          <div className="step-number">02</div>
          <div className="step-icon-clay">
            <Sparkles size={22} />
          </div>
          <h3 className="step-title">Analyze Reel</h3>
          <p className="step-desc">
            Our headless sandbox handles stream resolution, decrypts metadata, and fetches direct MP4 nodes.
          </p>
        </div>

        <div className="clay-card step-card">
          <div className="step-number">03</div>
          <div className="step-icon-clay">
            <DownloadCloud size={22} />
          </div>
          <h3 className="step-title">Download Instantly</h3>
          <p className="step-desc">
            Preview the media and copy the captions, hashtags, or stream the direct source file to your device.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
