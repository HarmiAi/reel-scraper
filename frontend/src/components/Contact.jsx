import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Contact = ({ navigate }) => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormState({ name: '', email: '', message: '' });
    }, 4000);
  };

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

      <div className="clay-card page-card contact-card">
        <h2 className="page-title text-gradient">Connect with Lumina</h2>
        <p className="page-subtitle">
          Have ideas, feature requests, or technical integration questions? Drop our architectural engineering desk a message below.
        </p>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form 
              key="form"
              onSubmit={handleSubmit} 
              className="contact-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="form-group">
                <label htmlFor="contact-name" className="form-label">Full Name</label>
                <div className="clay-input-wrapper">
                  <span className="input-icon-left"><Mail size={16} /></span>
                  <input 
                    type="text" 
                    id="contact-name"
                    required
                    className="clay-input" 
                    placeholder="Jane Doe"
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contact-email" className="form-label">Email Address</label>
                <div className="clay-input-wrapper">
                  <span className="input-icon-left"><Mail size={16} /></span>
                  <input 
                    type="email" 
                    id="contact-email"
                    required
                    className="clay-input" 
                    placeholder="jane@domain.com"
                    value={formState.email}
                    onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contact-msg" className="form-label">Message Details</label>
                <div className="clay-input-wrapper" style={{ alignItems: 'flex-start' }}>
                  <span className="input-icon-left" style={{ marginTop: '0.85rem' }}><MessageSquare size={16} /></span>
                  <textarea 
                    id="contact-msg"
                    required
                    className="clay-input" 
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    placeholder="Describe your inquiry..."
                    value={formState.message}
                    onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="btn-clay btn-clay-primary contact-submit">
                <Send size={16} /> Send Transmission
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="success"
              className="contact-success-state"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="success-icon-clay">
                <Check size={28} />
              </div>
              <h3>Message Received</h3>
              <p>
                Our engineering and support representatives have received your secure transmission. We will follow up via email within 24 business hours.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Contact;
