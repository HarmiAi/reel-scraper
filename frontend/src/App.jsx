import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { HelmetProvider } from 'react-helmet-async';
import Footer from './components/Footer.jsx';

// Lazy-loaded Views
const About = lazy(() => import('./components/About.jsx'));
const Contact = lazy(() => import('./components/Contact.jsx'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy.jsx'));
const TermsOfService = lazy(() => import('./components/TermsOfService.jsx'));
const Dashboard = lazy(() => import('./components/Dashboard.jsx'));
const NotFound = lazy(() => import('./components/NotFound.jsx'));
const BlogHub = lazy(() => import('./components/BlogHub.jsx'));
const BlogPost = lazy(() => import('./components/BlogPost.jsx'));
const FacebookDownloader = lazy(() => import('./platforms/facebook/FacebookDownloader.jsx'));
const InstagramDownloader = lazy(() => import('./platforms/instagram/InstagramDownloader.jsx'));

// Animated Page Loader Fallback
const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: '1rem' }}>
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color) 0%, rgba(97, 208, 122, 0.4) 100%)', boxShadow: 'var(--shadow-surface-active)' }}
    />
    <span style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      Loading Resource
    </span>
  </div>
);

const BlogPostWrapper = ({ navigate }) => {
  const { slug } = useParams();
  return (
    <Suspense fallback={<PageLoader />}>
      <BlogPost slug={slug} navigate={navigate} />
    </Suspense>
  );
};

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
        <main className="main-content">
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
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

                {/* Blog routes */}
                <Route path="/blog" element={<BlogHub navigate={navigate} />} />
                <Route path="/blog/:slug" element={<BlogPostWrapper navigate={navigate} />} />

                {/* Wildcard 404 handler */}
                <Route path="*" element={<NotFound navigate={navigate} />} />
              </Routes>
            </Suspense>
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
    <HelmetProvider>
      <Router>
        <AppContent />
      </Router>
    </HelmetProvider>
  );
};

export default App;
