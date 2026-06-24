import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Components
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';
import TermsOfService from './components/TermsOfService.jsx';
import Footer from './components/Footer.jsx';
import Dashboard from './components/Dashboard.jsx';

// Platforms Downloader Components
import InstagramDownloader from './platforms/instagram/InstagramDownloader.jsx';
import FacebookDownloader from './platforms/facebook/FacebookDownloader.jsx';

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Synchronize path transitions with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            {currentPath === '/about' && (
              <About key="about" navigate={navigate} />
            )}
            
            {currentPath === '/contact' && (
              <Contact key="contact" navigate={navigate} />
            )}

            {currentPath === '/privacy' && (
              <PrivacyPolicy key="privacy" navigate={navigate} />
            )}

            {currentPath === '/terms' && (
              <TermsOfService key="terms" navigate={navigate} />
            )}

            {currentPath === '/' && (
              <Dashboard key="dashboard" navigate={navigate} />
            )}

            {currentPath === '/instagram' && (
              <InstagramDownloader key="instagram" navigate={navigate} />
            )}

            {currentPath === '/facebook' && (
              <FacebookDownloader key="facebook" navigate={navigate} />
            )}

            {currentPath !== '/' && 
             currentPath !== '/instagram' && 
             currentPath !== '/facebook' && 
             currentPath !== '/about' && 
             currentPath !== '/contact' && 
             currentPath !== '/privacy' && 
             currentPath !== '/terms' && (
              <Dashboard key="404-dashboard" navigate={navigate} />
            )}
          </AnimatePresence>
        </main>

        {/* Global Footer */}
        <Footer navigate={navigate} currentPath={currentPath} />
      </div>
    </div>
  );
};

export default App;
