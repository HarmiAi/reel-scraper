import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, Send, Check, User, Clock, ShieldCheck, AlertCircle, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SeoManager from './SeoManager.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Contact = ({ navigate }) => {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({ name: '', email: '', subject: '', message: '', submit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Email format validation regex
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleInputChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    // Clear global errors
    setErrors({ name: '', email: '', subject: '', message: '', submit: '' });

    // Validate fields
    let hasErrors = false;
    const newErrors = { name: '', email: '', subject: '', message: '', submit: '' };

    if (!formState.name.trim()) {
      newErrors.name = 'Full name is required.';
      hasErrors = true;
    }

    if (!formState.email.trim()) {
      newErrors.email = 'Email address is required.';
      hasErrors = true;
    } else if (!validateEmail(formState.email)) {
      newErrors.email = 'Please enter a valid email address.';
      hasErrors = true;
    }

    if (!formState.subject.trim()) {
      newErrors.subject = 'Subject is required.';
      hasErrors = true;
    }

    if (!formState.message.trim()) {
      newErrors.message = 'Message details are required.';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Set loading state & block duplicates
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formState)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormState({ name: '', email: '', subject: '', message: '' });
      } else {
        setIsSubmitting(false);
        // Set real backend error message
        setErrors(prev => ({
          ...prev,
          submit: data.message || 'Server encountered an error while delivering the transmission.'
        }));
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error('[Contact Submit Error]', err);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to connect to the email server. Please check your network or try again later.'
      }));
    }
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
        "name": "Contact Us",
        "item": "https://thesavetube.com/contact"
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
        title="Contact The Save Tube - Get in Touch"
        description="Have questions, feedback, or business inquiries? Contact The Save Tube support team. We reply within 24 hours."
        canonicalPath="/contact"
        schemaData={breadcrumbSchema}
      />
      <div className="btn-back-container" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>
        <button className="btn-back btn-clay btn-clay-secondary" style={{ height: '36px', padding: '0 16px', borderRadius: 'var(--radius-full)' }} onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      <div className="page-card">
        <h2 className="page-title text-gradient">Connect with The Save Tube</h2>
        <p className="page-subtitle">
          Have ideas, feature requests, or technical integration questions? Drop our architectural engineering desk a message below.
        </p>

        <div className="contact-split-container">
          {/* Left Column: Contact info */}
          <div className="contact-info-card">
            <div className="contact-info-header">
              <h3>Support Channels</h3>
              <p>Direct communication to our engineering team.</p>
            </div>
            
            <div className="contact-details-list">
              <div className="contact-detail-item">
                <div className="contact-detail-icon">
                  <Mail size={16} />
                </div>
                <div className="contact-detail-text">
                  <h4>Email Address</h4>
                  <a href="mailto:harmipagada4@gmail.com">harmipagada4@gmail.com</a>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-detail-icon">
                  <Clock size={16} />
                </div>
                <div className="contact-detail-text">
                  <h4>Response Time</h4>
                  <p>Within 24 business hours</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-detail-icon">
                  <ShieldCheck size={16} />
                </div>
                <div className="contact-detail-text">
                  <h4>Privacy & Security</h4>
                  <p>Encrypted sandbox transmissions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact form */}
          <div className="contact-form-card">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="contact-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  noValidate
                >
                  <div className="form-group">
                    <label htmlFor="contact-name" className="form-label">Full Name</label>
                    <div className="clay-input-wrapper">
                      <span className="input-icon-left"><User size={16} /></span>
                      <input 
                        type="text" 
                        id="contact-name"
                        required
                        className="clay-input" 
                        placeholder="Jane Doe"
                        value={formState.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.name && <span className="contact-form-error">{errors.name}</span>}
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
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && <span className="contact-form-error">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-subject" className="form-label">Subject</label>
                    <div className="clay-input-wrapper">
                      <span className="input-icon-left"><Tag size={16} /></span>
                      <input 
                        type="text" 
                        id="contact-subject"
                        required
                        className="clay-input" 
                        placeholder="e.g., Bug Report / Creator Feedback"
                        value={formState.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.subject && <span className="contact-form-error">{errors.subject}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-msg" className="form-label">Message Details</label>
                    <div className="clay-input-wrapper" style={{ alignItems: 'flex-start', height: 'auto', minHeight: '120px' }}>
                      <span className="input-icon-left" style={{ marginTop: '0.85rem' }}><MessageSquare size={16} /></span>
                      <textarea 
                        id="contact-msg"
                        required
                        className="clay-input" 
                        style={{ minHeight: '100px', resize: 'vertical', padding: '0.5rem 0.25rem' }}
                        placeholder="Describe your inquiry..."
                        value={formState.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.message && <span className="contact-form-error">{errors.message}</span>}
                  </div>

                  {errors.submit && (
                    <div className="policy-callout" style={{ background: 'var(--error-soft)', borderLeftColor: 'var(--error-color)', padding: '0.75rem', margin: '0 0 1rem 0' }}>
                      <p style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} /> {errors.submit}
                      </p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn-clay btn-clay-primary contact-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-container">
                        <span className="spinner"></span> Sending Transmission...
                      </span>
                    ) : (
                      <>
                        <Send size={16} /> Send Transmission
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success-card"
                  className="contact-success-state"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                >
                  <div className="success-icon-clay">
                    <Check size={36} />
                  </div>
                  <h3>Message Received</h3>
                  <p>
                    Our engineering and support representatives have received your secure transmission. We will follow up via email within 24 business hours.
                  </p>
                  <button 
                    className="btn-clay btn-clay-secondary" 
                    style={{ marginTop: '1.5rem', height: '42px' }}
                    onClick={() => setIsSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;
