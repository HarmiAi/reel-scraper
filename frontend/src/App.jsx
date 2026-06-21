import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DownloadCloud, 
  Sparkles, 
  Clipboard, 
  Trash2, 
  Play, 
  Check, 
  ExternalLink, 
  X, 
  ChevronDown, 
  Heart, 
  MessageCircle, 
  FileText, 
  Music, 
  Download, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  validateReelUrl, 
  fetchReelData, 
  downloadVideoFile,
  parseShortcode
} from './services/reelService';

// Import SaaS page and product components
import Footer from './components/Footer.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';
import TermsOfService from './components/TermsOfService.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import SkeletonLoader from './components/SkeletonLoader.jsx';
import ErrorState from './components/ErrorState.jsx';
import UnlockModal from './components/UnlockModal.jsx';
import MobileActionSheet from './components/MobileActionSheet.jsx';
import DownloadSuccessScreen from './components/DownloadSuccessScreen.jsx';
import AnalyticsCards from './components/AnalyticsCards.jsx';

const FALLBACK_THUMBNAIL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%231a1a24"/><g fill="none" stroke="%233f3f56" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(170, 270)"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><path d="M7 2h10M5 22h14M12 18v-4M9 14h6"/></g><text x="50%" y="55%" font-family="sans-serif" font-size="14" fill="%236b6b83" dominant-baseline="middle" text-anchor="middle">Preview Unavailable</text></svg>`;

// GPU-Accelerated 3D Parallax Canvas Particles System
const CanvasParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height + height * 0.1;
        this.size = Math.random() * 2.2 + 0.6;
        this.speedX = Math.random() * 0.15 - 0.075;
        this.speedY = -(Math.random() * 0.35 + 0.05); // slowly float up
        this.alpha = Math.random() * 0.4 + 0.1;
        this.depth = Math.random() * 0.7 + 0.3; // 3D Parallax factor
        this.glow = Math.random() * 4 + 1;
      }

      update(mouseX, mouseY) {
        // Apply wind/parallax drift based on cursor position relative to screen center
        const driftX = (mouseX - width / 2) * 0.001 * this.depth;
        const driftY = (mouseY - height / 2) * 0.001 * this.depth;

        this.x += this.speedX + driftX;
        this.y += this.speedY + driftY;

        // Wrap around boundaries
        if (this.x < -10 || this.x > width + 10 || this.y < -10) {
          this.reset();
          this.y = height + 10;
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = '#E6C587';
        ctx.fillStyle = '#E6C587';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.depth, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const maxCount = Math.min(50, Math.floor((width * height) / 35000));
    const particles = Array.from({ length: maxCount }, () => new Particle());

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update(mouseX, mouseY);
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
};

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [reelData, setReelData] = useState(null);
  const [history, setHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [activeFaq, setActiveFaq] = useState({});
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // SaaS enhancements
  const [currentPage, setCurrentPage] = useState('home');
  const [errorDetails, setErrorDetails] = useState(null);

  // Phase 2 enhancements
  const [stats, setStats] = useState({ total: 0, hd: 0, sd: 0 });
  const [pendingQuality, setPendingQuality] = useState(null); // { key, label }
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [downloadSuccessData, setDownloadSuccessData] = useState(null); // { reelData, qualityName }
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuality, setFilterQuality] = useState('ALL'); // 'ALL' | 'BEST' | 'HD' | 'SD'

  const mascotRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('lumina_reel_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem('lumina_download_stats');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (updatedHistory) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem('lumina_reel_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  // Save stats helper
  const saveStats = (updatedStats) => {
    setStats(updatedStats);
    try {
      localStorage.setItem('lumina_download_stats', JSON.stringify(updatedStats));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  };

  // Toast Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 3D Parallax Mascot Tilt handler
  useEffect(() => {
    const handleMascotTilt = (e) => {
      const mascot = mascotRef.current;
      if (!mascot) return;
      
      const rect = mascot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate delta offsets relative to browser viewport limits
      const tiltX = (e.clientX - centerX) / (window.innerWidth / 2);
      const tiltY = (e.clientY - centerY) / (window.innerHeight / 2);
      
      // Limit 3D tilt angles to maximum 16 degrees
      mascot.style.transform = `rotateX(${-tiltY * 16}deg) rotateY(${tiltX * 16}deg)`;
    };

    window.addEventListener('mousemove', handleMascotTilt);
    return () => window.removeEventListener('mousemove', handleMascotTilt);
  }, []);

  // Spotlight card hover tracking helper
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  // Paste from clipboard helper
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        showToast('Pasted URL from clipboard', 'info');
      } else {
        showToast('Clipboard is empty', 'error');
      }
    } catch (err) {
      showToast('Could not access clipboard. Please paste manually.', 'error');
    }
  };

  // Helper to parse error details returned from backend
  const parseErrorType = (errorMsg) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes('private') || msg.includes('login') || msg.includes('restrict')) {
      return 'private_reel';
    }
    if (msg.includes('unsupported') || msg.includes('tiktok') || msg.includes('youtube') || msg.includes('platform')) {
      return 'unsupported_url';
    }
    if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many') || msg.includes('throttled')) {
      return 'rate_limited';
    }
    if (msg.includes('404') || msg.includes('not found') || msg.includes('delete')) {
      return 'reel_not_found';
    }
    return 'invalid_url';
  };

  // Helper to calculate file sizes dynamically
  const calculateSize = (durationStr, quality) => {
    let durationSec = 15; // default
    try {
      if (durationStr) {
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 2) {
          durationSec = parts[0] * 60 + parts[1];
        }
      }
    } catch (e) {}

    let bitrate = 1.2; // SD: 1.2 Mbps
    if (quality === 'HD') bitrate = 2.4; // HD: 2.4 Mbps
    if (quality === 'BEST') bitrate = 4.8; // Best: 4.8 Mbps

    const sizeBytes = (durationSec * bitrate * 1024 * 1024) / 8;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    return `${sizeMB} MB`;
  };

  // Submit Handler calling real API
  const handleDownloadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    
    const cleanedUrl = url.trim();
    if (!cleanedUrl) {
      showToast('Please enter an Instagram Reel URL', 'error');
      return;
    }

    // Strict URL validation before backend request
    try {
      const parsedUrl = new URL(cleanedUrl);
      if (parsedUrl.protocol !== 'https:') {
        setErrorDetails({
          type: 'invalid_url',
          message: 'Security Alert: Only secure HTTPS connections are allowed.'
        });
        showToast('Only HTTPS links are supported', 'error');
        return;
      }
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname !== 'instagram.com' && hostname !== 'www.instagram.com') {
        setErrorDetails({
          type: 'unsupported_url',
          message: 'Unsupported Platform: Only Instagram Reels, Posts, and TV links are allowed.'
        });
        showToast('Only Instagram links are supported', 'error');
        return;
      }
      const isPathValid = /^\/(reel|p|tv)\/[A-Za-z0-9_-]+/i.test(parsedUrl.pathname);
      if (!isPathValid) {
        setErrorDetails({
          type: 'invalid_url',
          message: 'Invalid Instagram path. Link must contain /reel/, /p/, or /tv/ shortcode.'
        });
        showToast('Invalid URL path structure', 'error');
        return;
      }
    } catch (e) {
      setErrorDetails({
        type: 'invalid_url',
        message: 'Malformed URL. Please copy-paste directly from Instagram.'
      });
      showToast('Malformed URL', 'error');
      return;
    }

    setIsLoading(true);
    setProgressPercent(0);
    setProgressStep('Analyzing Reel...');
    setReelData(null);
    setErrorDetails(null);
    setDownloadSuccessData(null);
    setIsPlayingPreview(false);

    // Dynamic extraction simulation ticks to keep the custom 3D morphing loader responsive
    let simulatedProgress = 0;
    const steps = [
      { t: 'Analyzing Reel...', min: 30 },
      { t: 'Fetching Metadata...', min: 65 },
      { t: 'Preparing Download...', min: 90 }
    ];

    const progressInterval = setInterval(() => {
      simulatedProgress += 1;
      if (simulatedProgress <= 92) {
        setProgressPercent(simulatedProgress);
        
        // Update steps text based on percentage
        const currentStep = steps.find(s => simulatedProgress <= s.min) || steps[steps.length - 1];
        setProgressStep(currentStep.t);
      }
    }, 90);

    try {
      // Execute REAL api call to Express backend
      const data = await fetchReelData(cleanedUrl);

      clearInterval(progressInterval);
      setProgressPercent(100);
      setProgressStep('Complete!');
      
      // Short delay for animation visual completion
      setTimeout(() => {
        setReelData(data);
        setIsLoading(false);
        showToast('Reel extracted successfully!', 'success');

        // Add to history list (max 20)
        const existingIndex = history.findIndex((item) => item.id === data.id);
        let updatedHistory = [...history];
        if (existingIndex !== -1) {
          updatedHistory.splice(existingIndex, 1);
        }
        updatedHistory = [
          {
            id: data.id,
            username: data.username,
            avatarUrl: data.avatarUrl,
            caption: data.caption,
            thumbnailUrl: data.thumbnailUrl,
            videoUrl: data.videoUrl,
            timestamp: Date.now()
          },
          ...updatedHistory
        ].slice(0, 20);
        
        saveHistory(updatedHistory);

        // Slide bottom action sheet on mobile viewport
        if (window.innerWidth <= 768) {
          setIsMobileSheetOpen(true);
        }
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setIsLoading(false);
      const errorMsg = err.message || 'Scraping failed. Confirm the Instagram post is public.';
      
      // Parse error type for custom ErrorState rendering
      const errorType = parseErrorType(errorMsg);
      setErrorDetails({
        type: errorType,
        message: errorMsg
      });
      
      showToast(errorMsg, 'error');
    }
  };

  // Direct download handler via backend proxy
  const handleDownloadMedia = async (mediaUrl, filename, quality = 'BEST') => {
    showToast('Piping stream download...', 'info');
    const success = await downloadVideoFile(mediaUrl, filename, quality);
    if (success) {
      showToast('Download started!', 'success');
      return true;
    } else {
      showToast('Could not start download, opening link instead.', 'error');
      return false;
    }
  };

  // Quality Selection Trigger
  const handleDownloadQuality = (qualityKey) => {
    if (isDownloading) return;
    const qualityLabel = qualityKey === 'BEST' ? 'High' : qualityKey === 'HD' ? 'Medium' : 'Low';
    
    if (qualityKey === 'SD') {
      triggerDirectDownload(qualityKey, qualityLabel);
    } else {
      setPendingQuality({ key: qualityKey, label: qualityLabel });
      setIsUnlockModalOpen(true);
    }
  };

  const handleUnlockComplete = () => {
    setIsUnlockModalOpen(false);
    if (pendingQuality) {
      triggerDirectDownload(pendingQuality.key, pendingQuality.label);
      setPendingQuality(null);
    }
  };

  const triggerDirectDownload = async (qualityKey, qualityLabel) => {
    if (isDownloading) return;
    setIsDownloading(true);
    showToast('Preparing Download...', 'info');

    // Show friendly preparation steps
    const steps = [
      'Preparing Download...',
      `Fetching ${qualityKey} Quality...`,
      'Generating Download Link...'
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        showToast(steps[stepIndex], 'info');
        stepIndex++;
      }
    }, 700);

    try {
      const filename = `lumina_${reelData.id || 'reel'}_${qualityKey.toLowerCase()}.mp4`;
      const success = await downloadVideoFile(reelData.videoUrl, filename, qualityKey, reelData.id);
      
      clearInterval(stepInterval);
      setIsDownloading(false);

      if (success) {
        showToast('Download started!', 'success');
        
        // Save stats
        const updatedStats = {
          total: stats.total + 1,
          hd: (qualityKey === 'HD' || qualityKey === 'BEST') ? stats.hd + 1 : stats.hd,
          sd: qualityKey === 'SD' ? stats.sd + 1 : stats.sd
        };
        saveStats(updatedStats);

        // Update history with quality
        const updatedHistory = history.map(item => {
          if (item.id === reelData.id) {
            return { ...item, quality: qualityLabel };
          }
          return item;
        });
        saveHistory(updatedHistory);

        // Trigger success view
        setDownloadSuccessData({ reelData, qualityName: qualityLabel });
      }
    } catch (err) {
      clearInterval(stepInterval);
      setIsDownloading(false);
      showToast('Download stream pipe failed. Retrying direct...', 'error');
      window.open(reelData.videoUrl, '_blank');
    }
  };

  // Quick select demo reel using REAL Puppeteer extraction
  const handleSelectDemo = (demoUrl) => {
    if (isLoading) return;
    setUrl(demoUrl);
    showToast('Selected demo reel. Resolving link...', 'info');
    
    // Auto-trigger the real API flow
    setTimeout(() => {
      setIsLoading(true);
      setProgressPercent(0);
      setProgressStep('Analyzing Reel...');
      setReelData(null);
      setErrorDetails(null);
      setDownloadSuccessData(null);

      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += 1.5;
        if (simulatedProgress <= 90) {
          setProgressPercent(Math.floor(simulatedProgress));
          if (simulatedProgress < 30) setProgressStep('Analyzing Reel...');
          else if (simulatedProgress < 65) setProgressStep('Fetching Metadata...');
          else setProgressStep('Preparing Download...');
        }
      }, 80);

      fetchReelData(demoUrl)
        .then((data) => {
          clearInterval(progressInterval);
          setProgressPercent(100);
          setProgressStep('Complete!');
          
          setTimeout(() => {
            setReelData(data);
            setIsLoading(false);
            showToast('Demo reel resolved successfully!', 'success');
            
            const existingIndex = history.findIndex((item) => item.id === data.id);
            let updatedHistory = [...history];
            if (existingIndex !== -1) {
              updatedHistory.splice(existingIndex, 1);
            }
            updatedHistory = [
              {
                id: data.id,
                username: data.username,
                avatarUrl: data.avatarUrl,
                caption: data.caption,
                thumbnailUrl: data.thumbnailUrl,
                videoUrl: data.videoUrl,
                timestamp: Date.now()
              },
              ...updatedHistory
            ].slice(0, 20);
            saveHistory(updatedHistory);

            if (window.innerWidth <= 768) {
              setIsMobileSheetOpen(true);
            }
          }, 500);
        })
        .catch((err) => {
          clearInterval(progressInterval);
          setIsLoading(false);
          const errorMsg = err.message || 'Scraping failed.';
          setErrorDetails({
            type: parseErrorType(errorMsg),
            message: errorMsg
          });
          showToast(errorMsg, 'error');
        });
    }, 400);
  };

  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    showToast('Removed from history', 'info');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your download history?')) {
      saveHistory([]);
      showToast('History cleared', 'info');
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCopyCaption = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Caption copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy caption', 'error'));
  };

  const handleCopyHashtags = (captionText) => {
    if (!captionText) {
      showToast('No caption text to extract hashtags from', 'error');
      return;
    }
    const hashtags = captionText.match(/#[a-zA-Z0-9_]+/g);
    if (hashtags && hashtags.length > 0) {
      const hashtagStr = hashtags.join(' ');
      navigator.clipboard.writeText(hashtagStr)
        .then(() => showToast('Hashtags copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy hashtags', 'error'));
    } else {
      showToast('No hashtags found in the caption', 'info');
    }
  };

  const handleShareApp = () => {
    const shareUrl = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: 'Lumina Reels Downloader',
        text: 'Save public Instagram reels instantly in high quality with a fast, secure, creator-friendly experience!',
        url: shareUrl,
      })
      .then(() => showToast('Thanks for sharing!', 'success'))
      .catch(() => {
        navigator.clipboard.writeText(shareUrl)
          .then(() => showToast('Website link copied to clipboard!', 'success'));
      });
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast('Website link copied to clipboard!', 'success'));
    }
  };

  const handleShareReel = (reelId) => {
    const shareUrl = `https://www.instagram.com/reel/${reelId || reelData.id}/`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('Instagram Reel link copied!', 'success'))
      .catch(() => showToast('Failed to copy link', 'error'));
  };

  const handleLoadFromHistory = (item) => {
    setReelData(item);
    setErrorDetails(null);
    setDownloadSuccessData(null);
    setUrl(item.id ? `https://www.instagram.com/reel/${item.id}/` : '');
    setIsPlayingPreview(false);
    
    const cardEl = document.getElementById('downloader-card-anchor');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Filter history records based on search keywords and filter quality tags
  const getFilteredHistory = () => {
    return history.filter((item) => {
      const matchesSearch = searchQuery.trim() === '' || 
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesFilter = true;
      if (filterQuality !== 'ALL') {
        const itemQual = item.quality ? item.quality.toUpperCase() : '';
        matchesFilter = itemQual.includes(filterQuality);
      }

      return matchesSearch && matchesFilter;
    });
  };

  const filteredHistory = getFilteredHistory();

  return (
    <>
      {/* Dynamic 3D Parallax Particles & Grain Overlays */}
      <CanvasParticles />
      <div className="grain-overlay" />
      
      {/* Ambient drifting lights */}
      <div className="ambient-glow-container">
        <div className="glow-circle glow-circle-1" />
        <div className="glow-circle glow-circle-2" />
        <div className="glow-circle glow-circle-3" />
      </div>

      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div 
            className="logo-container" 
            onClick={() => { setCurrentPage('home'); setErrorDetails(null); setReelData(null); setUrl(''); setDownloadSuccessData(null); }} 
            style={{ cursor: 'pointer' }}
          >
            <div className="logo-icon-clay">
              <Sparkles size={18} />
            </div>
            <span className="text-gradient">Lumina Reels</span>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => { setCurrentPage('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn-clay btn-clay-secondary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
            >
              About
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <AnimatePresence mode="wait">
            {currentPage === 'about' && (
              <About key="about" setCurrentPage={setCurrentPage} />
            )}
            
            {currentPage === 'contact' && (
              <Contact key="contact" setCurrentPage={setCurrentPage} />
            )}

            {currentPage === 'privacy' && (
              <PrivacyPolicy key="privacy" setCurrentPage={setCurrentPage} />
            )}

            {currentPage === 'terms' && (
              <TermsOfService key="terms" setCurrentPage={setCurrentPage} />
            )}

            {currentPage === 'home' && (
              <motion.div
                key="home-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {/* Hero Section */}
                <section className="hero-section">
                  <div className="hero-badge">
                    <span className="badge-dot"></span>
                    SaaS Creator Toolkit
                  </div>
                  
                  <h1 className="hero-heading">
                    Download Instagram Reels <br />
                    <span className="text-gradient">Instantly</span>
                  </h1>
                  
                  <p className="hero-subheading subtitle">
                    Save public Instagram reels in high quality with a fast, secure, creator-friendly experience.
                  </p>

                  {/* 3D Abstract Camera Sculpture Mascot (Parallax controlled) */}
                  <div className="sculpture-wrapper">
                    <div ref={mascotRef} className="sculpture-container">
                      <div className="sculpture-ribbon-2" />
                      <div className="sculpture-canister" />
                      <div className="sculpture-rim">
                        <div className="sculpture-lens" />
                      </div>
                      <div className="sculpture-ribbon-1" />
                    </div>
                  </div>
                </section>

                {/* Animated downloaded counter */}
                <AnimatedCounter target={12458} />

                {/* Downloader Card Anchor */}
                <div id="downloader-card-anchor" className="downloader-card-container">
                  <div 
                    className="clay-card downloader-card spotlight-card"
                    onMouseMove={handleCardMouseMove}
                  >
                    {/* Reactive Spotlight Glow div */}
                    <div className="spotlight-glow" />
                    
                    <AnimatePresence mode="wait">
                      
                      {/* A. ERROR STATE */}
                      {!isLoading && errorDetails && (
                        <motion.div
                          key="error-state-card"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          style={{ zIndex: 2 }}
                        >
                          <ErrorState 
                            errorType={errorDetails.type}
                            customMessage={errorDetails.message}
                            onReset={() => {
                              setErrorDetails(null);
                              setUrl('');
                            }}
                          />
                        </motion.div>
                      )}

                      {/* B. SUCCESS DOWNLOAD STATE */}
                      {!isLoading && downloadSuccessData && (
                        <motion.div
                          key="download-success-view"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          style={{ zIndex: 2 }}
                        >
                          <DownloadSuccessScreen 
                            reelData={downloadSuccessData.reelData}
                            qualityName={downloadSuccessData.qualityName}
                            onReset={() => {
                              setDownloadSuccessData(null);
                              setReelData(null);
                              setUrl('');
                            }}
                            onViewHistory={() => {
                              const el = document.getElementById('history-section-anchor');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            onShareApp={handleShareApp}
                          />
                        </motion.div>
                      )}

                      {/* C. INPUT STATE */}
                      {!isLoading && !reelData && !errorDetails && !downloadSuccessData && (
                        <motion.div
                          key="input-state"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          style={{ display: 'flex', flexDirection: 'column', gap: '2rem', zIndex: 2 }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Paste Reel URL</h3>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                              Enter a valid public Instagram video link to pull the stream container.
                            </p>
                          </div>

                          <form onSubmit={handleDownloadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="clay-input-wrapper">
                              <span className="input-icon-left">
                                <DownloadCloud size={20} />
                              </span>
                              
                              <label htmlFor="instagram-url-input" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
                                Instagram Reel URL
                              </label>
                              <input
                                type="text"
                                id="instagram-url-input"
                                className="clay-input"
                                placeholder="https://www.instagram.com/reel/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                aria-label="Instagram Reel URL"
                              />

                              {url && (
                                <button
                                  type="button"
                                  className="btn-clay btn-clay-paste"
                                  style={{ padding: '0.5rem', background: 'transparent', boxShadow: 'none', border: 'none', color: 'var(--text-tertiary)' }}
                                  onClick={() => setUrl('')}
                                  aria-label="Clear Input"
                                >
                                  <X size={16} />
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn-clay btn-clay-paste"
                                onClick={handlePaste}
                                aria-label="Paste from clipboard"
                              >
                                <Clipboard size={14} /> Paste
                              </button>
                            </div>

                            <motion.button
                              type="submit"
                              className="btn-clay btn-clay-primary"
                              disabled={isLoading}
                              whileHover={isLoading ? {} : { y: -2 }}
                              whileTap={isLoading ? {} : { y: 1 }}
                              style={isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            >
                              <DownloadCloud size={18} /> Extract Media
                            </motion.button>
                          </form>

                          {/* Quick Demos Panel */}
                          <div className="demo-reels-container">
                            <span className="demo-title">Try Public Instagram Presets</span>
                            <div className="demo-chips">
                              <button
                                className="demo-chip"
                                onClick={() => handleSelectDemo('https://www.instagram.com/reel/CdmYaq3LAYo/')}
                              >
                                Public Reel 🎬
                              </button>
                              <button
                                className="demo-chip"
                                onClick={() => handleSelectDemo('https://www.instagram.com/tv/CdmYaq3LAYo/')}
                              >
                                Public IGTV 📺
                              </button>
                              <button
                                className="demo-chip"
                                onClick={() => handleSelectDemo('https://www.instagram.com/p/CdmYaq3LAYo/')}
                              >
                                Public Post 📸
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* D. LOADING STATE */}
                      {isLoading && !errorDetails && !downloadSuccessData && (
                        <motion.div
                          key="loading-state"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="loader-wrapper"
                          style={{ zIndex: 2, width: '100%' }}
                        >
                          <div className="clay-loader-sphere" />
                          <div className="loader-shadow" />
                          
                          <div className="loader-status-container">
                            <span className="loader-percent">{progressPercent}%</span>
                            <span className="loader-step">{progressStep}</span>
                          </div>

                          <div className="loader-progress-bar-bg">
                            <div 
                              className="loader-progress-bar-fill"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <SkeletonLoader />
                        </motion.div>
                      )}

                      {/* E. SUCCESS ANALYSIS VIEW (Reel Preview Panel) */}
                      {!isLoading && reelData && !errorDetails && !downloadSuccessData && (
                        <motion.div
                          key="success-state"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                          className="success-card"
                          style={{ zIndex: 2 }}
                        >
                          {/* Media Thumbnail Column */}
                          <div className="success-thumbnail-wrapper">
                            {isPlayingPreview ? (
                              <video
                                src={reelData.videoUrl}
                                className="success-thumbnail"
                                controls
                                autoPlay
                                playsInline
                                style={{ objectFit: 'contain', background: '#000' }}
                              />
                            ) : (
                              <>
                                <img 
                                  src={reelData.thumbnailUrl} 
                                  alt="Reel Cover" 
                                  className="success-thumbnail" 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_THUMBNAIL;
                                  }}
                                />
                                <button 
                                  className="thumbnail-play-overlay"
                                  onClick={() => setIsPlayingPreview(true)}
                                  aria-label="Play video preview"
                                >
                                  <Play size={22} fill="currentColor" style={{ marginLeft: '4px' }} />
                                </button>
                                <span className="thumbnail-duration">{reelData.duration}</span>
                              </>
                            )}
                          </div>

                          {/* Meta Details Column */}
                          <div className="success-details">
                            
                            {/* Creator */}
                            <div className="creator-profile">
                              <div className="creator-avatar-clay">
                                <img src={reelData.avatarUrl} alt={reelData.username} className="creator-avatar" />
                              </div>
                              <div className="creator-meta">
                                <div className="creator-name-row">
                                  <span className="creator-username">@{reelData.username}</span>
                                  {reelData.verified && (
                                    <span className="verified-icon" title="Verified Creator">
                                      <ShieldCheck size={16} fill="currentColor" color="#080706" />
                                    </span>
                                  )}
                                </div>
                                <span className="creator-followers">Public Reel Stream</span>
                              </div>
                            </div>

                            {/* Caption (Sunken scroll box) */}
                            <div className="success-caption">
                              <p style={{ fontSize: '0.88rem', margin: 0 }}>{reelData.caption}</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="reel-statistics-grid">
                              <div className="stat-item-clay">
                                <Heart size={16} className="stat-icon" />
                                <div className="stat-info">
                                  <span className="stat-label">Likes</span>
                                  <span className="stat-value">{reelData.likes}</span>
                                </div>
                              </div>
                              <div className="stat-item-clay">
                                <MessageCircle size={16} className="stat-icon" />
                                <div className="stat-info">
                                  <span className="stat-label">Comments</span>
                                  <span className="stat-value">{reelData.comments}</span>
                                </div>
                              </div>
                              <div className="stat-item-clay">
                                <Music size={16} className="stat-icon" />
                                <div className="stat-info">
                                  <span className="stat-label">Audio</span>
                                  <span className="stat-value">Original</span>
                                </div>
                              </div>
                            </div>

                            {/* Quality Selector Section */}
                            <div className="quality-selector-container">
                              <h4 className="quality-title-saas">Select Download Quality</h4>
                              <div className="quality-grid-saas">
                                
                                {/* Best Quality Card */}
                                <div 
                                  className="clay-card quality-card-saas" 
                                  onClick={() => handleDownloadQuality('BEST')}
                                  style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                                >
                                  <span className="quality-badge-saas badge-best">High</span>
                                  <span className="quality-res-saas">Original / 1080p</span>
                                  <div className="quality-meta-info">
                                    <span className="quality-size-saas">{reelData.highSize || calculateSize(reelData.duration, 'BEST')}</span>
                                    <span>MP4 Format</span>
                                  </div>
                                </div>

                                {/* HD Quality Card */}
                                <div 
                                  className="clay-card quality-card-saas" 
                                  onClick={() => handleDownloadQuality('HD')}
                                  style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                                >
                                  <span className="quality-badge-saas badge-hd">Medium</span>
                                  <span className="quality-res-saas">720p</span>
                                  <div className="quality-meta-info">
                                    <span className="quality-size-saas">{reelData.mediumSize || calculateSize(reelData.duration, 'HD')}</span>
                                    <span>MP4 Format</span>
                                  </div>
                                </div>

                                {/* SD Quality Card */}
                                <div 
                                  className="clay-card quality-card-saas" 
                                  onClick={() => handleDownloadQuality('SD')}
                                  style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                                >
                                  <span className="quality-badge-saas badge-sd">Low</span>
                                  <span className="quality-res-saas">480p</span>
                                  <div className="quality-meta-info">
                                    <span className="quality-size-saas">{reelData.lowSize || calculateSize(reelData.duration, 'SD')}</span>
                                    <span>MP4 Format</span>
                                  </div>
                                </div>

                              </div>
                            </div>

                            {/* Actions Group */}
                            <div className="success-actions">
                              <div className="download-options-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                  <button
                                    className="btn-clay btn-clay-secondary"
                                    style={{ padding: '0.75rem 1.2rem', fontSize: '0.9rem', flex: 1 }}
                                    onClick={() => handleCopyCaption(reelData.caption)}
                                  >
                                    <FileText size={16} /> Copy Caption
                                  </button>
                                  
                                  <button
                                    className="btn-clay btn-clay-secondary"
                                    style={{ padding: '0.75rem 1.2rem', fontSize: '0.9rem', flex: 1 }}
                                    onClick={() => handleCopyHashtags(reelData.caption)}
                                  >
                                    <Sparkles size={16} /> Copy Hashtags
                                  </button>
                                </div>
                                <button
                                  className="btn-clay btn-clay-secondary"
                                  style={{ padding: '0.75rem 1.2rem', fontSize: '0.9rem', width: '100%' }}
                                  onClick={() => handleDownloadMedia(reelData.thumbnailUrl, `lumina_${reelData.id || 'reel'}_cover.jpg`)}
                                >
                                  <Download size={16} /> Download Cover Image
                                </button>
                              </div>

                              {/* Back / Downloader reset */}
                              <div className="btn-back-container" style={{ marginTop: '0.75rem' }}>
                                <button 
                                  className="btn-back"
                                  onClick={() => {
                                    setReelData(null);
                                    setUrl('');
                                    setErrorDetails(null);
                                    setDownloadSuccessData(null);
                                  }}
                                >
                                  <ArrowLeft size={16} /> Extract Another link
                                </button>
                              </div>

                            </div>

                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>

                  </div>
                </div>

                {/* Local Statistics/Analytics Dashboard */}
                <AnalyticsCards stats={stats} />

                {/* Recent Downloads Section */}
                <section id="history-section-anchor" className="history-section">
                  <div className="history-header">
                    <h2 className="history-heading">Recent Downloads</h2>
                    {history.length > 0 && (
                      <button className="btn-clear-history" onClick={handleClearHistory} aria-label="Clear download history">
                        <Trash2 size={13} /> Clear All
                      </button>
                    )}
                  </div>

                  {/* Search and Filters Bar */}
                  {history.length > 0 && (
                    <div className="history-filters-bar">
                      <div className="clay-input-wrapper history-search-wrapper" style={{ padding: '0.35rem' }}>
                        <input 
                          type="text" 
                          className="clay-input" 
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.5rem' }}
                          placeholder="Search history by creator/caption..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          aria-label="Search download history"
                        />
                      </div>
                      
                      <div className="history-filter-chips">
                        {['ALL', 'BEST', 'HD', 'SD'].map((q) => (
                          <button
                            key={q}
                            className={`history-filter-chip ${filterQuality === q ? 'active' : ''}`}
                            onClick={() => setFilterQuality(q)}
                          >
                            {q === 'ALL' ? 'All' : q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="history-list">
                    <AnimatePresence initial={false}>
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3 }}
                            className="clay-card history-item-card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleLoadFromHistory(item)}
                          >
                            <div className="history-thumbnail-wrapper">
                              <img 
                                src={item.thumbnailUrl} 
                                alt="" 
                                className="history-thumbnail" 
                                loading="lazy" 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = FALLBACK_THUMBNAIL;
                                }}
                              />
                            </div>
                            
                            <div className="history-details">
                              <div className="history-user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="history-username">@{item.username}</span>
                                {item.quality && (
                                  <span className="history-quality-tag">{item.quality}</span>
                                )}
                              </div>
                              <p className="history-caption">{item.caption}</p>
                            </div>

                            <div className="history-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="btn-history-action"
                                title="View Details"
                                onClick={() => handleLoadFromHistory(item)}
                                aria-label={`Restore details for ${item.username}`}
                              >
                                <RefreshCw size={14} />
                              </button>
                              
                              <button
                                className="btn-history-action"
                                title="Download MP4"
                                onClick={() => {
                                  const qKey = (item.quality || '').includes('480') ? 'SD' : (item.quality || '').includes('720') ? 'HD' : 'BEST';
                                  handleDownloadMedia(item.videoUrl, `lumina_${item.id}_${qKey.toLowerCase()}.mp4`, qKey);
                                }}
                                aria-label={`Download mp4 file for ${item.username}`}
                              >
                                <Download size={14} />
                              </button>

                              <button
                                className="btn-history-action btn-delete"
                                title="Remove from history"
                                onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                                aria-label={`Delete ${item.username} from history`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          key="empty"
                          className="clay-card history-empty-card"
                        >
                          <Info size={28} className="history-empty-icon" />
                          <span>
                            {history.length > 0 
                              ? 'No matches found matching your filters.' 
                              : 'Your curated download catalog is empty. Paste a link to get started.'}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* How It Works Section */}
                <HowItWorks />

                {/* Features Section */}
                <section className="features-section">
                  <h2 className="features-heading">Engineered for the Modern Creator</h2>
                  <div className="features-grid">
                    
                    <div className="clay-card feature-card">
                      <div className="feature-icon-clay">
                        <Zap size={20} />
                      </div>
                      <h3 className="feature-title">Headless Extraction</h3>
                      <p className="feature-desc">
                        Our backend clusters spin up sandboxed Chromium environments to fetch actual media files from the Instagram CDN.
                      </p>
                    </div>

                    <div className="clay-card feature-card">
                      <div className="feature-icon-clay">
                        <ShieldCheck size={20} />
                      </div>
                      <h3 className="feature-title">Secure & Private</h3>
                      <p className="feature-desc">
                        We never store credentials, session cookies, or tracker history. Downloads stream directly through memory.
                      </p>
                    </div>

                    <div className="clay-card feature-card">
                      <div className="feature-icon-clay">
                        <Sparkles size={20} />
                      </div>
                      <h3 className="feature-title">Ultra Bitrate Extracts</h3>
                      <p className="feature-desc">
                        Always grab the highest bitrate and resolution available from the Instagram CDN servers without compression loss.
                      </p>
                    </div>

                  </div>
                </section>

                {/* FAQ Accordion Section */}
                <section className="faq-section">
                  <h2 className="faq-heading">Frequently Asked Questions</h2>
                  
                  <div className="faq-list">
                    {[
                      {
                        q: "Is Lumina Reels free?",
                        a: "Yes, Lumina Reels is a 100% free creator utility. There are no registration forms, hidden monthly subscription tiers, advertising overlays, or export limits."
                      },
                      {
                        q: "Is it safe?",
                        a: "Absolutely. Lumina Reels operates under a strict privacy-first model. We do not require credential logs, session storage trackers, or account authorization. All videos stream dynamically through isolated sandboxed environments directly to your local device memory."
                      },
                      {
                        q: "Does it work with private reels?",
                        a: "No. Private reels restrict access to unauthorized viewer nodes on Instagram's server side. Lumina Reels respects content privacy settings and only processes links originating from public profiles."
                      },
                      {
                        q: "What quality is supported?",
                        a: "We extract the highest possible quality and bitrate available from the Instagram CDN container nodes (typically raw 1080p MP4 formats) without any additional compression loss."
                      },
                      {
                        q: "Is registration required?",
                        a: "No registration is required. You can start downloading and indexing public Instagram reels instantly without creating an account."
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="clay-card faq-item-card">
                        <button 
                          className="faq-trigger" 
                          onClick={() => toggleFaq(idx)}
                          aria-expanded={activeFaq[idx] ? "true" : "false"}
                        >
                          <span className="faq-question">{item.q}</span>
                          <motion.span 
                            className="faq-arrow"
                            animate={{ rotate: activeFaq[idx] ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={18} />
                          </motion.span>
                        </button>
                        
                        <div 
                          className="faq-content"
                          style={{ 
                            maxHeight: activeFaq[idx] ? '200px' : '0px'
                          }}
                        >
                          <div className="faq-answer">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Footer */}
        <Footer setCurrentPage={setCurrentPage} currentPage={currentPage} />

        {/* Toast Alerts System */}
        <div className="toasts-container">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
                className="clay-card toast-clay"
              >
                <span className={`toast-icon ${toast.type}`}>
                  {toast.type === 'success' && <Check size={18} />}
                  {toast.type === 'error' && <AlertCircle size={18} />}
                  {toast.type === 'info' && <Info size={18} />}
                </span>
                
                <span className="toast-message">{toast.message}</span>
                
                <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close Notification">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Unlock Sponsor Ad Modal Component */}
        <UnlockModal 
          isOpen={isUnlockModalOpen} 
          onClose={() => setIsUnlockModalOpen(false)} 
          onUnlock={handleUnlockComplete}
          qualityName={pendingQuality?.label}
        />

        {/* Mobile bottom sheet drawer */}
        <AnimatePresence>
          {isMobileSheetOpen && reelData && (
            <MobileActionSheet 
              isOpen={isMobileSheetOpen}
              onClose={() => setIsMobileSheetOpen(false)}
              reelData={reelData}
              onDownloadClick={() => {
                const el = document.getElementById('downloader-card-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onCopyCaption={() => handleCopyCaption(reelData.caption)}
              onCopyHashtags={() => handleCopyHashtags(reelData.caption)}
              onShareClick={() => handleShareReel(reelData.id)}
              onViewHistory={() => {
                const el = document.getElementById('history-section-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </>
  );
}

export default App;
