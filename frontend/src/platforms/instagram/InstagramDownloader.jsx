import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  DownloadCloud, X, Clipboard, ArrowLeft, RefreshCw, Download, Trash2, 
  Info, FileText, Sparkles, CheckCircle, Heart, MessageCircle, Play
} from 'lucide-react';

import { 
  validateInstagramUrl, normalizeInstagramUrl,
  fetchInstagramReelData, downloadInstagramVideoFile 
} from './instagramService.js';

import UnlockModal from '../../components/UnlockModal.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import DownloadSuccessScreen from '../../components/DownloadSuccessScreen.jsx';
import MobileActionSheet from '../../components/MobileActionSheet.jsx';
import AnalyticsCards from '../../components/AnalyticsCards.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import AnimatedCounter from '../../components/AnimatedCounter.jsx';

const FALLBACK_THUMBNAIL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%231a1a24"/><g fill="none" stroke="%233f3f56" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(170, 270)"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><path d="M7 2h10M5 22h14M12 18v-4M9 14h6"/></g><text x="50%" y="55%" font-family="sans-serif" font-size="14" fill="%236b6b83" dominant-baseline="middle" text-anchor="middle">Preview Unavailable</text></svg>`;

const InstagramDownloader = ({ navigate }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [reelData, setReelData] = useState(null);
  const [history, setHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [activeQuality, setActiveQuality] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [pendingQuality, setPendingQuality] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    hd: 0,
    sd: 0,
    mostDownloadedCreator: 'None'
  });

  const mascotRef = useRef(null);
  const toastIdCounter = useRef(0);

  // Sync state stats and history on startup
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('savetube_ig_history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));

      const storedStats = localStorage.getItem('savetube_ig_stats');
      if (storedStats) setStats(JSON.parse(storedStats));
    } catch (e) {
      console.error('LocalStorage sync failed:', e);
    }
  }, []);

  // Mascot tilt tracking logic
  useEffect(() => {
    const handleMascotTilt = (e) => {
      const mascot = mascotRef.current;
      if (!mascot) return;
      const rect = mascot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const tiltX = (e.clientX - centerX) / (window.innerWidth / 2);
      const tiltY = (e.clientY - centerY) / (window.innerHeight / 2);
      mascot.style.transform = `rotateX(${-tiltY * 16}deg) rotateY(${tiltX * 16}deg)`;
    };
    window.addEventListener('mousemove', handleMascotTilt);
    return () => window.removeEventListener('mousemove', handleMascotTilt);
  }, []);

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('savetube_ig_history', JSON.stringify(newHistory));
  };

  const saveStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem('savetube_ig_stats', JSON.stringify(newStats));
  };

  const showToast = (message, type = 'info') => {
    const id = toastIdCounter.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      showToast('Pasted link from clipboard', 'success');
    } catch (err) {
      showToast('Clipboard access denied. Paste link manually.', 'error');
    }
  };

  const parseErrorType = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes('private')) return 'private_account';
    if (lower.includes('not found') || lower.includes('404')) return 'not_found';
    if (lower.includes('timeout')) return 'timeout';
    if (lower.includes('network')) return 'network_error';
    return 'extraction_failed';
  };

  const calculateSize = (durationStr, quality) => {
    if (!durationStr) return '1.5 MB';
    let durationSec = 30;
    try {
      if (durationStr.includes(':')) {
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 2) {
          durationSec = parts[0] * 60 + parts[1];
        }
      }
    } catch (e) {}

    let bitrate = 1.2;
    if (quality === 'HD') bitrate = 2.4;
    if (quality === 'BEST') bitrate = 4.8;

    const sizeBytes = (durationSec * bitrate * 1024 * 1024) / 8;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    return `${sizeMB} MB`;
  };

  const handleDirectQualitySubmit = async (qualityKey) => {
    const cleanedUrl = url.trim();
    if (!cleanedUrl) {
      showToast('Please enter an Instagram Reel URL', 'error');
      return;
    }

    const normalized = normalizeInstagramUrl(cleanedUrl);
    if (!validateInstagramUrl(normalized)) {
      setErrorDetails({
        type: 'invalid_url',
        message: 'Invalid Instagram URL format. The Save Tube supports public reel, post, and IGTV links.'
      });
      showToast('Invalid URL path structure', 'error');
      return;
    }

    if (reelData && reelData.url === normalized) {
      handleDownloadQuality(qualityKey);
      return;
    }

    setIsLoading(true);
    setErrorDetails(null);
    setDownloadSuccessData(null);
    setIsPlayingPreview(false);

    try {
      const data = await fetchInstagramReelData(normalized);
      setReelData(data);

      const qualityLabel = qualityKey === 'BEST' ? 'High' : qualityKey === 'HD' ? 'Medium' : 'Low';
      const filename = `savetube_ig_${data.id || 'reel'}_${qualityKey.toLowerCase()}.mp4`;

      // Trigger actual download proxy stream
      await downloadInstagramVideoFile(data.videoUrl, filename, qualityKey, data.id);

      // Record download stats
      const counts = {};
      let maxCount = 0;
      let mostDownloaded = stats.mostDownloadedCreator || 'None';

      const itemInHistory = {
        id: data.id,
        username: data.username,
        avatarUrl: data.avatarUrl,
        caption: data.caption,
        thumbnailUrl: data.thumbnailUrl,
        videoUrl: data.videoUrl,
        timestamp: Date.now(),
        quality: qualityLabel
      };

      const existingIndex = history.findIndex((item) => item.id === data.id);
      let updatedHistory = [...history];
      if (existingIndex !== -1) {
        updatedHistory.splice(existingIndex, 1);
      }
      updatedHistory = [itemInHistory, ...updatedHistory].slice(0, 20);
      saveHistory(updatedHistory);

      updatedHistory.forEach(item => {
        if (item.username) {
          counts[item.username] = (counts[item.username] || 0) + 1;
        }
      });

      Object.keys(counts).forEach(username => {
        if (counts[username] > maxCount) {
          maxCount = counts[username];
          mostDownloaded = `@${username}`;
        }
      });

      const updatedStats = {
        total: stats.total + 1,
        hd: (qualityKey === 'HD' || qualityKey === 'BEST') ? stats.hd + 1 : stats.hd,
        sd: qualityKey === 'SD' ? stats.sd + 1 : stats.sd,
        mostDownloadedCreator: mostDownloaded
      };
      saveStats(updatedStats);

      setDownloadSuccessData({ reelData: data, qualityName: qualityLabel });
      setIsLoading(false);
      showToast('Download started successfully!', 'success');

    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.message || 'Scraping failed. Confirm the Instagram post is public and accessible.';
      const errorType = parseErrorType(errorMsg);
      setErrorDetails({
        type: errorType,
        message: errorMsg
      });
      showToast(errorMsg, 'error');
    }
  };

  const handleDownloadQuality = (qualityKey) => {
    if (isDownloading) return;
    setActiveQuality(qualityKey);
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
      const filename = `savetube_ig_${reelData.id || 'reel'}_${qualityKey.toLowerCase()}.mp4`;
      const success = await downloadInstagramVideoFile(reelData.videoUrl, filename, qualityKey, reelData.id);
      
      clearInterval(stepInterval);
      setIsDownloading(false);

      if (success) {
        showToast('Download started!', 'success');
        
        const counts = {};
        let maxCount = 0;
        let mostDownloaded = stats.mostDownloadedCreator || 'None';
        
        const tempHistory = history.map(item => {
          if (item.id === reelData.id) {
            return { ...item, quality: qualityLabel };
          }
          return item;
        });

        tempHistory.forEach(item => {
          if (item.username) {
            counts[item.username] = (counts[item.username] || 0) + 1;
          }
        });
        
        Object.keys(counts).forEach(username => {
          if (counts[username] > maxCount) {
            maxCount = counts[username];
            mostDownloaded = `@${username}`;
          }
        });

        const updatedStats = {
          total: stats.total + 1,
          hd: (qualityKey === 'HD' || qualityKey === 'BEST') ? stats.hd + 1 : stats.hd,
          sd: qualityKey === 'SD' ? stats.sd + 1 : stats.sd,
          mostDownloadedCreator: mostDownloaded
        };
        saveStats(updatedStats);

        const updatedHistory = history.map(item => {
          if (item.id === reelData.id) {
            return { ...item, quality: qualityLabel };
          }
          return item;
        });
        saveHistory(updatedHistory);

        setDownloadSuccessData({ reelData, qualityName: qualityLabel });
      }
    } catch (e) {
      clearInterval(stepInterval);
      setIsDownloading(false);
      showToast('Download request failed.', 'error');
    }
  };

  const handleSelectDemo = (demoUrl) => {
    if (isLoading) return;
    setUrl(demoUrl);
    showToast('Selected Instagram demo. Resolving link...', 'info');
    
    setTimeout(() => {
      setIsLoading(true);
      setProgressPercent(0);
      setProgressStep('Validating URL...');
      setReelData(null);
      setErrorDetails(null);
      setDownloadSuccessData(null);

      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += 1.5;
        if (simulatedProgress <= 90) {
          setProgressPercent(Math.floor(simulatedProgress));
          if (simulatedProgress < 15) setProgressStep('Validating URL...');
          else if (simulatedProgress < 40) setProgressStep('Analyzing Video...');
          else if (simulatedProgress < 70) setProgressStep('Fetching Metadata...');
          else setProgressStep('Preparing Download...');
        }
      }, 80);

      fetchInstagramReelData(normalizeInstagramUrl(demoUrl))
        .then((data) => {
          clearInterval(progressInterval);
          setProgressPercent(100);
          setProgressStep('Complete!');
          
          setTimeout(() => {
            setReelData(data);
            setIsLoading(false);
            showToast('Instagram video metadata synchronized.', 'success');

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
          setErrorDetails({
            type: 'invalid_url',
            message: 'Failed to fetch demo Instagram video metadata.'
          });
        });
    }, 400);
  };

  const handleCopyCaption = (captionText) => {
    if (!captionText) {
      showToast('Caption is empty', 'error');
      return;
    }
    navigator.clipboard.writeText(captionText)
      .then(() => showToast('Caption copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy caption.', 'error'));
  };

  const handleClearHistory = () => {
    saveHistory([]);
    showToast('Download logs cleared.', 'success');
  };

  const getFilteredHistory = () => {
    return history.filter(item => {
      const match = item.id && item.id.length > 0;
      return match;
    });
  };

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const [downloadSuccessData, setDownloadSuccessData] = useState(null);
  const filteredHistory = getFilteredHistory();

  return (
    <motion.div
      key="instagram-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Back button to Hub Dashboard */}
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <button className="btn-back" onClick={() => navigate('/')} style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to Hub selection
        </button>
      </div>

      {/* Hero Section */}
      <section className="hero-section" style={{ marginBottom: '0.75rem' }}>
        <div className="hero-badge" style={{ marginBottom: '0.4rem' }}>
          <span className="badge-dot" style={{ background: 'var(--instagram-primary)' }}></span>
          Instagram Video Downloader
        </div>
        
        <h1 className="hero-heading" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', lineHeight: 1.15, marginBottom: '0.25rem' }}>
          Download Instagram Reels
        </h1>
        
        <p className="hero-subheading subtitle" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', maxWidth: '480px' }}>
          Paste a public link below to extract your video instantly.
        </p>

        {/* Mascot */}
        <div className="sculpture-wrapper">
          <div ref={mascotRef} className="sculpture-container">
            <div className="sculpture-ribbon-2" style={{ background: 'var(--instagram-primary)' }} />
            <div className="sculpture-canister" />
            <div className="sculpture-rim">
              <div className="sculpture-lens" />
            </div>
            <div className="sculpture-ribbon-1" style={{ background: 'var(--instagram-secondary)' }} />
          </div>
        </div>
      </section>

      {/* Downloader Card */}
      <div id="downloader-card-anchor" className="downloader-card-container">
        <div 
          className="clay-card downloader-card spotlight-card"
          onMouseMove={handleCardMouseMove}
        >
          <div className="spotlight-glow" />

          {/* Form and Input Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', zIndex: 2, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Paste Instagram URL</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Enter a valid public Instagram reel, post, or IGTV link to pull the stream container.
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="clay-input-wrapper">
                <span className="input-icon-left">
                  <DownloadCloud size={20} />
                </span>
                
                <label htmlFor="instagram-url-input" style={{ display: 'none' }}>
                  Instagram Reel URL
                </label>
                <input
                  type="text"
                  id="instagram-url-input"
                  className="clay-input"
                  placeholder="https://www.instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  aria-label="Instagram Reel URL"
                />

                {url && !isLoading && (
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
                  disabled={isLoading}
                  aria-label="Paste from clipboard"
                >
                  <Clipboard size={14} /> Paste
                </button>
              </div>

              {/* Direct Quality Download Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', width: '100%' }}>
                <button
                  type="button"
                  className="btn-clay btn-clay-primary"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                  disabled={isLoading}
                  onClick={() => handleDirectQualitySubmit('SD')}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>SD</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Standard (480p)</span>
                </button>
                
                <button
                  type="button"
                  className="btn-clay btn-clay-primary"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                  disabled={isLoading}
                  onClick={() => handleDirectQualitySubmit('HD')}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>HD</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Medium (720p)</span>
                </button>

                <button
                  type="button"
                  className="btn-clay btn-clay-primary"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                  disabled={isLoading}
                  onClick={() => handleDirectQualitySubmit('BEST')}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Best</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>High (1080p)</span>
                </button>
              </div>
            </form>

            {/* Quick Demos Panel */}
            {!isLoading && !reelData && !errorDetails && !downloadSuccessData && (
              <div className="demo-reels-container" style={{ marginTop: '-0.5rem' }}>
                <span className="demo-title">Try Public Instagram Presets</span>
                <div className="demo-chips">
                  <button
                    className="demo-chip"
                    onClick={() => handleSelectDemo('https://www.instagram.com/reel/DZ4OpNEJCg7/')}
                  >
                    Public Reel 📸
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Content Section */}
          <div style={{ width: '100%', marginTop: (isLoading || reelData || errorDetails || downloadSuccessData) ? '1.5rem' : 0, zIndex: 2 }}>
            <AnimatePresence mode="wait">
              
              {/* A. LOADING STATE */}
              {isLoading && !errorDetails && !downloadSuccessData && (
                <motion.div
                  key="loading-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SkeletonLoader progress={progressPercent} step={progressStep} />
                </motion.div>
              )}

              {/* B. ERROR STATE */}
              {errorDetails && !isLoading && (
                <motion.div
                  key="error-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <ErrorState 
                    type={errorDetails.type} 
                    message={errorDetails.message} 
                    onRetry={() => handleDirectQualitySubmit('BEST')}
                  />
                </motion.div>
              )}

              {/* C. SUCCESS ANALYSIS VIEW */}
              {!isLoading && reelData && !errorDetails && !downloadSuccessData && (
                <motion.div
                  key="success-state"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="success-card"
                  style={{ width: '100%' }}
                >
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
                          alt="" 
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
                          <Play size={20} style={{ fill: 'var(--primary-color)', marginLeft: '3px' }} />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="success-details">
                    <div className="creator-profile">
                      <div className="creator-avatar-clay">
                        <img 
                          src={reelData.avatarUrl} 
                          alt="" 
                          className="creator-avatar" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                          }}
                        />
                      </div>
                      <div className="creator-meta">
                        <div className="creator-name-row">
                          <span className="creator-username">@{reelData.username}</span>
                          {reelData.verified && <CheckCircle size={14} className="verified-icon" />}
                        </div>
                        <span className="creator-followers">Creator Account</span>
                      </div>
                    </div>

                    <p className="success-caption">{reelData.caption}</p>

                    <div className="reel-statistics-grid">
                      <div className="stat-item-clay">
                        <Heart size={14} className="stat-icon" />
                        <div className="stat-info">
                          <span className="stat-label">Likes</span>
                          <span className="stat-value">{reelData.likes}</span>
                        </div>
                      </div>
                      <div className="stat-item-clay">
                        <MessageCircle size={14} className="stat-icon" />
                        <div className="stat-info">
                          <span className="stat-label">Comments</span>
                          <span className="stat-value">{reelData.comments}</span>
                        </div>
                      </div>
                    </div>

                    <div className="quality-selector-container">
                      <h4 className="quality-title-saas">Select Download Quality</h4>
                      <div className="quality-grid-saas">
                        <div 
                          className={`clay-card quality-card-saas card-best ${activeQuality === 'BEST' ? 'active' : ''}`} 
                          onClick={() => handleDownloadQuality('BEST')}
                          style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                        >
                          <span className="quality-badge-saas badge-best">Best</span>
                          <span className="quality-res-saas">Best Available Quality (1080p)</span>
                          <div className="quality-meta-info">
                            <span className="quality-size-saas">Est. Size: {reelData.highSize || calculateSize(reelData.duration, 'BEST')}</span>
                            <span>MP4 Format</span>
                          </div>
                        </div>

                        <div 
                          className={`clay-card quality-card-saas card-hd ${activeQuality === 'HD' ? 'active' : ''}`} 
                          onClick={() => handleDownloadQuality('HD')}
                          style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                        >
                          <span className="quality-badge-saas badge-hd">HD</span>
                          <span className="quality-res-saas">HD Quality (720p)</span>
                          <div className="quality-meta-info">
                            <span className="quality-size-saas">Est. Size: {reelData.mediumSize || calculateSize(reelData.duration, 'HD')}</span>
                            <span>MP4 Format</span>
                          </div>
                        </div>

                        <div 
                          className={`clay-card quality-card-saas card-sd ${activeQuality === 'SD' ? 'active' : ''}`} 
                          onClick={() => handleDownloadQuality('SD')}
                          style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                        >
                          <span className="quality-badge-saas badge-sd">SD</span>
                          <span className="quality-res-saas">Standard Definition (480p)</span>
                          <div className="quality-meta-info">
                            <span className="quality-size-saas">Est. Size: {reelData.lowSize || calculateSize(reelData.duration, 'SD')}</span>
                            <span>MP4 Format</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                      <button 
                        className="btn-clay btn-clay-secondary"
                        style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', padding: '0.65rem', flex: 1, fontSize: '0.85rem' }}
                        onClick={() => handleCopyCaption(reelData.caption)}
                      >
                        <FileText size={16} /> Copy Caption
                      </button>
                      <button 
                        className="btn-clay btn-clay-secondary"
                        style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', padding: '0.65rem', flex: 1, fontSize: '0.85rem' }}
                        onClick={() => {
                          setReelData(null);
                          setUrl('');
                        }}
                      >
                        <RefreshCw size={16} /> Reset Form
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* D. DOWNLOAD SUCCESS DISPLAY */}
              {downloadSuccessData && !isLoading && (
                <motion.div
                  key="download-success-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <DownloadSuccessScreen 
                    reelData={downloadSuccessData.reelData} 
                    qualityName={downloadSuccessData.qualityName} 
                    onReset={() => {
                      setDownloadSuccessData(null);
                      setReelData(null);
                      setUrl('');
                    }}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <AnalyticsCards stats={stats} />

      {/* Download History Log */}
      {filteredHistory.length > 0 && (
        <section className="history-section-clay">
          <div className="history-header">
            <h3 className="history-title">Recent Downloads History</h3>
            <button className="btn-clear-history" onClick={handleClearHistory}>
              <Trash2 size={14} /> Clear Logs
            </button>
          </div>
          <div className="history-list">
            {filteredHistory.map((item, idx) => (
              <div key={item.id + '_' + idx} className="history-item-clay spotlight-card" onMouseMove={handleCardMouseMove}>
                <div className="spotlight-glow" />
                <div className="history-item-meta" style={{ zIndex: 2 }}>
                  <div className="history-avatar-wrapper">
                    <img 
                      src={item.thumbnailUrl} 
                      alt="" 
                      className="history-avatar-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_THUMBNAIL;
                      }}
                    />
                  </div>
                  <div className="history-item-details">
                    <span className="history-creator">@{item.username || 'instagram.creator'}</span>
                    <span className="history-caption">{item.caption || 'Public Reel'}</span>
                    <span className="history-time">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Quality: {item.quality || 'High'}</span>
                  </div>
                </div>
                <button
                  className="btn-clay btn-clay-primary history-download-btn"
                  onClick={() => {
                    setUrl(item.url || '');
                    setReelData(item);
                    setTimeout(() => {
                      const element = document.getElementById('downloader-card-anchor');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  style={{ zIndex: 2 }}
                >
                  <Download size={14} /> Reload
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unlock Premium Modal */}
      <UnlockModal 
        isOpen={isUnlockModalOpen} 
        onClose={() => setIsUnlockModalOpen(false)} 
        onUnlockComplete={handleUnlockComplete} 
      />

      {/* Action Toast Notifications */}
      <div className="toast-container-clay">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`toast-clay toast-${toast.type}`}
            >
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Drawer Slide-up Sheet */}
      <MobileActionSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        reelData={reelData}
        isDownloading={isDownloading}
        activeQuality={activeQuality}
        handleDownloadQuality={handleDownloadQuality}
        calculateSize={calculateSize}
      />
    </motion.div>
  );
};

export default InstagramDownloader;
