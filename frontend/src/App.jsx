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

  // Save history helper
  const saveHistory = (updatedHistory) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem('lumina_reel_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history", e);
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

  // Submit Handler calling real API
  const handleDownloadSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const cleanedUrl = url.trim();
    if (!cleanedUrl) {
      showToast('Please enter an Instagram Reel URL', 'error');
      return;
    }

    if (!validateReelUrl(cleanedUrl)) {
      showToast('Invalid format. URL must be a public Instagram Reel, Post, or TV link.', 'error');
      return;
    }

    setIsLoading(true);
    setProgressPercent(0);
    setProgressStep('Launching headless engine...');
    setReelData(null);
    setIsPlayingPreview(false);

    // Dynamic extraction simulation ticks to keep the custom 3D morphing loader responsive
    let simulatedProgress = 0;
    const steps = [
      { t: 'Starting Chromium sandbox...', min: 10 },
      { t: 'Navigating to Instagram page...', min: 30 },
      { t: 'Decrypting video content hashes...', min: 55 },
      { t: 'Extracting stream node links...', min: 75 },
      { t: 'Packaging download package...', min: 90 }
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

        // Add to history list
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
        ].slice(0, 10);
        
        saveHistory(updatedHistory);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setIsLoading(false);
      showToast(err.message || 'Scraping failed. Confirm the Instagram post is public.', 'error');
    }
  };

  // Direct download handler via backend proxy
  const handleDownloadMedia = async (mediaUrl, filename) => {
    showToast('Piping stream download...', 'info');
    const success = await downloadVideoFile(mediaUrl, filename);
    if (success) {
      showToast('Download started!', 'success');
    } else {
      showToast('Could not start download, opening link instead.', 'error');
    }
  };

  // Quick select demo reel using REAL Puppeteer extraction
  const handleSelectDemo = (demoUrl) => {
    setUrl(demoUrl);
    showToast('Selected demo reel. Resolving link...', 'info');
    
    // Auto-trigger the real API flow
    setTimeout(() => {
      setIsLoading(true);
      setProgressPercent(0);
      setProgressStep('Launching headless engine...');
      setReelData(null);

      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += 1.5;
        if (simulatedProgress <= 90) {
          setProgressPercent(Math.floor(simulatedProgress));
          if (simulatedProgress < 25) setProgressStep('Starting Chromium sandbox...');
          else if (simulatedProgress < 50) setProgressStep('Navigating to Instagram page...');
          else if (simulatedProgress < 75) setProgressStep('Extracting stream node links...');
          else setProgressStep('Packaging download package...');
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
            ].slice(0, 10);
            saveHistory(updatedHistory);
          }, 500);
        })
        .catch((err) => {
          clearInterval(progressInterval);
          setIsLoading(false);
          showToast(err.message, 'error');
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

  const handleLoadFromHistory = (item) => {
    setReelData(item);
    setUrl(item.id ? `https://www.instagram.com/reel/${item.id}/` : '');
    setIsPlayingPreview(false);
    
    const cardEl = document.getElementById('downloader-card-anchor');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
          <div className="logo-container">
            <div className="logo-icon-clay">
              <Sparkles size={18} />
            </div>
            <span className="text-gradient">Lumina Reels</span>
          </div>
          <div className="header-actions">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-clay btn-clay-secondary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
            >
              Docs <ExternalLink size={14} />
            </a>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              AI Creator Toolkit
            </div>
            
            <h1 className="hero-heading">
              Download Instagram Reels <br />
              <span className="text-gradient">Beautifully.</span>
            </h1>
            
            <p className="hero-subheading subtitle">
              Extract raw MP4 video streams directly from public Instagram nodes. No watermarks, ads, or login wrappers.
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

          {/* Downloader Card Anchor */}
          <div id="downloader-card-anchor" className="downloader-card-container">
            <div 
              className="clay-card downloader-card spotlight-card"
              onMouseMove={handleCardMouseMove}
            >
              {/* Reactive Spotlight Glow div */}
              <div className="spotlight-glow" />
              
              <AnimatePresence mode="wait">
                
                {/* 1. INPUT STATE */}
                {!isLoading && !reelData && (
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
                        
                        <input
                          type="text"
                          className="clay-input"
                          placeholder="https://www.instagram.com/reel/..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />

                        {url && (
                          <button
                            type="button"
                            className="btn-clay btn-clay-paste"
                            style={{ padding: '0.5rem', background: 'transparent', boxShadow: 'none', border: 'none', color: 'var(--text-tertiary)' }}
                            onClick={() => setUrl('')}
                          >
                            <X size={16} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-clay btn-clay-paste"
                          onClick={handlePaste}
                        >
                          <Clipboard size={14} /> Paste
                        </button>
                      </div>

                      <motion.button
                        type="submit"
                        className="btn-clay btn-clay-primary"
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 1 }}
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

                {/* 2. LOADING STATE */}
                {isLoading && (
                  <motion.div
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="loader-wrapper"
                    style={{ zIndex: 2 }}
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
                  </motion.div>
                )}

                {/* 3. SUCCESS STATE */}
                {!isLoading && reelData && (
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
                          />
                          <button 
                            className="thumbnail-play-overlay"
                            onClick={() => setIsPlayingPreview(true)}
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

                      {/* Actions */}
                      <div className="success-actions">
                        <motion.button
                          className="btn-clay btn-clay-primary"
                          onClick={() => handleDownloadMedia(reelData.videoUrl, `lumina_${reelData.id || 'reel'}.mp4`)}
                          whileHover={{ y: -2 }}
                          whileTap={{ y: 1 }}
                        >
                          <Download size={18} /> Export Video File (MP4)
                        </motion.button>
                        
                        <div className="download-options-group">
                          <button
                            className="btn-clay btn-clay-secondary"
                            style={{ padding: '0.75rem 1.2rem', fontSize: '0.9rem' }}
                            onClick={() => handleCopyCaption(reelData.caption)}
                          >
                            <FileText size={16} /> Copy Caption
                          </button>
                          
                          <button
                            className="btn-clay btn-clay-secondary"
                            style={{ padding: '0.75rem 1.2rem', fontSize: '0.9rem' }}
                            onClick={() => handleDownloadMedia(reelData.thumbnailUrl, `lumina_${reelData.id || 'reel'}_cover.jpg`)}
                          >
                            <Download size={16} /> Cover Image
                          </button>
                        </div>

                        {/* Back / Downloader reset */}
                        <div className="btn-back-container" style={{ marginTop: '0.75rem' }}>
                          <button 
                            className="btn-back"
                            onClick={() => {
                              setReelData(null);
                              setUrl('');
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

          {/* Recent Downloads Section */}
          <section className="history-section">
            <div className="history-header">
              <h2 className="history-heading">Recent Downloads</h2>
              {history.length > 0 && (
                <button className="btn-clear-history" onClick={handleClearHistory}>
                  <Trash2 size={13} /> Clear All
                </button>
              )}
            </div>

            <div className="history-list">
              <AnimatePresence initial={false}>
                {history.length > 0 ? (
                  history.map((item) => (
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
                        <img src={item.thumbnailUrl} alt="" className="history-thumbnail" />
                      </div>
                      
                      <div className="history-details">
                        <div className="history-user-info">
                          <span className="history-username">@{item.username}</span>
                        </div>
                        <p className="history-caption">{item.caption}</p>
                      </div>

                      <div className="history-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-history-action"
                          title="View Details"
                          onClick={() => handleLoadFromHistory(item)}
                        >
                          <RefreshCw size={14} />
                        </button>
                        
                        <button
                          className="btn-history-action"
                          title="Download MP4"
                          onClick={() => handleDownloadMedia(item.videoUrl, `lumina_${item.id}.mp4`)}
                        >
                          <Download size={14} />
                        </button>

                        <button
                          className="btn-history-action btn-delete"
                          title="Remove from history"
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
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
                    <span>Your curated download catalog is empty. Paste a link to get started.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

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
                <h3 className="feature-title">Secure & Secure</h3>
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
                  q: "How does the Lumina downloader work?",
                  a: "Lumina Reels parses public Instagram media payloads using Puppeteer. It targets the direct CDN stream URL associated with the shortcode in your link, fetching the raw MP4 media file directly so you get it without any extra watermarks or compression."
                },
                {
                  q: "Do I need to log in to my Instagram account?",
                  a: "No, Lumina Reels does not require your credentials, login cookies, or any authorization. It processes all links completely anonymously, ensuring your personal account remains safe."
                },
                {
                  q: "Can I download reels from private accounts?",
                  a: "No, because private accounts restrict direct access to media nodes on Instagram's server side. Lumina Reels only works on public posts, IGTVs, and Reels."
                },
                {
                  q: "Is there a limit to the number of downloads?",
                  a: "Absolutely not. Lumina Reels is built as a clean creator utility with zero throttling, advertising caps, or paywalls. Use it as much as you need."
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

        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-links">
            <a href="#downloader-card-anchor" className="footer-link">Downloader</a>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>•</span>
            <a href="https://github.com" className="footer-link">Documentation</a>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>•</span>
            <a href="https://instagram.com" className="footer-link">Instagram API</a>
          </div>
          <p className="footer-text">
            © 2026 Lumina Creator Toolkit. Handcrafted with luxury minimalist aesthetics. All rights reserved.
          </p>
          <span className="footer-tagline">Premium Awwwards Concept</span>
        </footer>

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
                
                <button className="toast-close" onClick={() => removeToast(toast.id)}>
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </>
  );
}

export default App;
