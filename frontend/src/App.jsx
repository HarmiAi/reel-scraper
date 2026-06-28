import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Components
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';
import TermsOfService from './components/TermsOfService.jsx';
import Footer from './components/Footer.jsx';
import Dashboard from './components/Dashboard.jsx';
import NotFound from './components/NotFound.jsx';

// Platforms Downloader Components
import FacebookDownloader from './platforms/facebook/FacebookDownloader.jsx';
import InstagramDownloader from './platforms/instagram/InstagramDownloader.jsx';

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="app-root-container">
      {/* Premium Noise Grain Overlay */}
      <div className="grain-overlay" />
      
      {/* Ambient drifting lights */}
      <div className="ambient-glow-container">
        <div className="glow-circle glow-circle-1" />
        <div className="glow-circle glow-circle-2" />
        <div className="glow-circle glow-circle-3" />
      </div>

      <div className="app-container">
        {/* Global Header */}
        <header className="header">
          <div 
            className="logo-container" 
            onClick={() => navigate('/')} 
            style={{ cursor: 'pointer' }}
          >
            <div className="logo-icon-clay">
              <Sparkles size={18} />
            </div>
            <span className="text-gradient">The Save Tube</span>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => navigate('/about')}
              className="btn-clay btn-clay-secondary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
            >
              About
            </button>
          </div>
        </header>

        {/* Dynamic Route View Switching */}
        <main style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard navigate={navigate} />} />
              <Route path="/facebook" element={<FacebookDownloader navigate={navigate} />} />
              <Route path="/instagram" element={<InstagramDownloader navigate={navigate} />} />
              <Route path="/about" element={<About navigate={navigate} />} />
              <Route path="/contact" element={<Contact navigate={navigate} />} />
              
              {/* Privacy and Terms routes + aliases */}
              <Route path="/privacy" element={<PrivacyPolicy navigate={navigate} />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy navigate={navigate} />} />
              
              <Route path="/terms" element={<TermsOfService navigate={navigate} />} />
              <Route path="/terms-of-service" element={<TermsOfService navigate={navigate} />} />

              {/* Wildcard 404 handler */}
              <Route path="*" element={<NotFound navigate={navigate} />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Global Footer */}
        <Footer navigate={navigate} currentPath={location.pathname} />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
