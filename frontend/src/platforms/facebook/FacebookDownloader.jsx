import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  DownloadCloud, X, Clipboard, ArrowLeft, RefreshCw, Download, Trash2, 
  Info, FileText, Sparkles, CheckCircle, Heart, MessageCircle, Play
} from 'lucide-react';

import { 
  validateFacebookUrl, parseFacebookId, 
  fetchFacebookData, downloadFacebookFile 
} from './facebookService.js';

import UnlockModal from '../../components/UnlockModal.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import DownloadSuccessScreen from '../../components/DownloadSuccessScreen.jsx';
import MobileActionSheet from '../../components/MobileActionSheet.jsx';
import AnalyticsCards from '../../components/AnalyticsCards.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import AnimatedCounter from '../../components/AnimatedCounter.jsx';

const FALLBACK_THUMBNAIL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%231a1a24"/><g fill="none" stroke="%233f3f56" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(170, 270)"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><path d="M7 2h10M5 22h14M12 18v-4M9 14h6"/></g><text x="50%" y="55%" font-family="sans-serif" font-size="14" fill="%236b6b83" dominant-baseline="middle" text-anchor="middle">Preview Unavailable</text></svg>`;

const FacebookDownloader = ({ navigate }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [reelData, setReelData] = useState(null);
  const [history, setHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  const [stats, setStats] = useState({ total: 0, hd: 0, sd: 0, mostDownloadedCreator: 'None' });
  const [pendingQuality, setPendingQuality] = useState(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [downloadSuccessData, setDownloadSuccessData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuality, setFilterQuality] = useState('ALL');
  const [activeQuality, setActiveQuality] = useState('BEST');

  const mascotRef = useRef(null);

  // 3D Parallax Mascot Tilt handler
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

  // Load history from localStorage (facebook-specific namespace)
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('savetube_facebook_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load Facebook history", e);
    }
  }, []);

  // Load stats from localStorage (facebook-specific namespace)
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem('savetube_facebook_stats');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
    } catch (e) {
      console.error("Failed to load Facebook stats", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (updatedHistory) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem('savetube_facebook_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save Facebook history", e);
    }
  };

  // Save stats helper
  const saveStats = (updatedStats) => {
    setStats(updatedStats);
    try {
      localStorage.setItem('savetube_facebook_stats', JSON.stringify(updatedStats));
    } catch (e) {
      console.error("Failed to save Facebook stats", e);
    }
  };

  // Toast Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

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

  const calculateSize = (durationStr, quality) => {
    let durationSec = 15;
    try {
      if (durationStr) {
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

  const handleDownloadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    
    const cleanedUrl = url.trim();
    if (!cleanedUrl) {
      showToast('Please enter a Facebook Reel URL', 'error');
      return;
    }

    if (cleanedUrl.toLowerCase().includes('instagram.com')) {
      setErrorDetails({
        type: 'invalid_url',
        message: 'This application currently supports Facebook Reel downloads only.'
      });
      showToast('Instagram links are not supported', 'error');
      return;
    }

    if (!validateFacebookUrl(cleanedUrl)) {
      setErrorDetails({
        type: 'invalid_url',
        message: 'Invalid Facebook URL format. The Save Tube supports public Facebook reels and video links.'
      });
      showToast('Invalid URL path structure', 'error');
      return;
    }

    setIsLoading(true);
    setProgressPercent(15);
    setProgressStep('Validating URL...');
    setReelData(null);
    setErrorDetails(null);
    setDownloadSuccessData(null);
    setIsPlayingPreview(false);

    const timer1 = setTimeout(() => {
      setProgressPercent(45);
      setProgressStep('Analyzing Video...');
    }, 150);

    const timer2 = setTimeout(() => {
      setProgressPercent(75);
      setProgressStep('Fetching Metadata...');
    }, 350);

    const timer3 = setTimeout(() => {
      setProgressPercent(90);
      setProgressStep('Preparing Download...');
    }, 600);

    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 98) return prev + 1;
        return prev;
      });
    }, 300);

    try {
      const data = await fetchFacebookData(cleanedUrl);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(progressInterval);

      setProgressPercent(100);
      setProgressStep('Complete!');
      
      setTimeout(() => {
        setReelData(data);
        setIsLoading(false);
        showToast('Facebook video extracted successfully!', 'success');

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

    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(progressInterval);
      setIsLoading(false);
      const errorMsg = err.message || 'Scraping failed. Confirm the Facebook post is public.';
      
      const errorType = parseErrorType(errorMsg);
      setErrorDetails({
        type: errorType,
        message: errorMsg
      });
      
      showToast(errorMsg, 'error');
    }
  };

  const handleDirectQualitySubmit = async (qualityKey) => {
    const cleanedUrl = url.trim();
    if (!cleanedUrl) {
      showToast('Please enter a Facebook Video URL', 'error');
      return;
    }

    if (!validateFacebookUrl(cleanedUrl)) {
      setErrorDetails({
        type: 'invalid_url',
        message: 'Invalid Facebook URL format. The Save Tube supports public Facebook reels and video links.'
      });
      showToast('Invalid URL path structure', 'error');
      return;
    }

    if (reelData && reelData.url === cleanedUrl) {
      handleDownloadQuality(qualityKey);
      return;
    }

    setIsLoading(true);
    setErrorDetails(null);
    setDownloadSuccessData(null);
    setIsPlayingPreview(false);

    try {
      const data = await fetchFacebookData(cleanedUrl);
      setReelData(data);

      const qualityLabel = qualityKey === 'BEST' ? 'High' : qualityKey === 'HD' ? 'Medium' : 'Low';
      const filename = `savetube_${data.id || 'video'}_${qualityKey.toLowerCase()}.mp4`;

      // Trigger actual download proxy stream
      await downloadFacebookFile(data.videoUrl, filename, qualityKey, data.id);

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
      const errorMsg = err.message || 'Scraping failed. Confirm the Facebook post is public.';
      const errorType = parseErrorType(errorMsg);
      setErrorDetails({
        type: errorType,
        message: errorMsg
      });
      showToast(errorMsg, 'error');
    }
  };

  const handleDownloadMedia = async (mediaUrl, filename, quality = 'BEST') => {
    showToast('Piping stream download...', 'info');
    const success = await downloadFacebookFile(mediaUrl, filename, quality);
    if (success) {
      showToast('Download started!', 'success');
      return true;
    } else {
      showToast('Could not start download, opening link instead.', 'error');
      return false;
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
      const filename = `savetube_fb_${reelData.id || 'video'}_${qualityKey.toLowerCase()}.mp4`;
      const downloadUrl = (qualityKey === 'SD' && reelData.sdVideoUrl) 
        ? reelData.sdVideoUrl 
        : ((qualityKey === 'HD' && reelData.hdVideoUrl) ? reelData.hdVideoUrl : reelData.videoUrl);
      const success = await downloadFacebookFile(downloadUrl, filename, qualityKey, reelData.id);
      
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
    showToast('Selected Facebook demo. Resolving link...', 'info');
    
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

      fetchFacebookData(demoUrl)
        .then((data) => {
          clearInterval(progressInterval);
          setProgressPercent(100);
          setProgressStep('Complete!');
          
          setTimeout(() => {
            setReelData(data);
            setIsLoading(false);
            showToast('Facebook video metadata synchronized.', 'success');

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
            message: 'Failed to fetch demo Facebook video metadata.'
          });
        });
    }, 400);
  };

  const handleCopyCaption = (captionText) => {
    if (!captionText) {
      showToast('Caption is empty', 'error');
      return;
    }
    navigator.clipboard.writeText(captionText);
    showToast('Caption copied to clipboard!', 'success');
  };

  const handleCopyHashtags = (captionText) => {
    if (!captionText) {
      showToast('No hashtags found', 'error');
      return;
    }
    const hashtags = captionText.match(/#[A-Za-z0-9_]+/g);
    if (hashtags && hashtags.length > 0) {
      navigator.clipboard.writeText(hashtags.join(' '));
      showToast('Hashtags copied to clipboard!', 'success');
    } else {
      showToast('No hashtags detected in caption', 'error');
    }
  };

  const handleDeleteHistoryItem = (id, e) => {
    if (e) e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    showToast('Removed from history', 'info');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your Facebook download history?')) {
      saveHistory([]);
      showToast('History cleared', 'info');
    }
  };

  const handleLoadFromHistory = (item) => {
    setReelData(item);
    setUrl('');
    setErrorDetails(null);
    setDownloadSuccessData(null);
    setIsPlayingPreview(false);
    showToast(`Loaded details for @${item.username}`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareApp = () => {
    navigator.clipboard.writeText(window.location.origin);
    showToast('The Save Tube link copied to clipboard!', 'success');
  };

  const getFilteredHistory = () => {
    return history.filter((item) => {
      const matchSearch = searchQuery.trim() === '' || 
        (item.username && item.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (filterQuality === 'ALL') return matchSearch;
      if (filterQuality === 'BEST') return matchSearch && item.quality === 'High';
      if (filterQuality === 'HD') return matchSearch && item.quality === 'Medium';
      if (filterQuality === 'SD') return matchSearch && item.quality === 'Low';
      return matchSearch;
    });
  };

  const filteredHistory = getFilteredHistory();

  return (
    <motion.div
      key="facebook-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Hero Section */}
      <section className="hero-section" style={{ marginBottom: '0.75rem' }}>
        <div className="hero-badge" style={{ marginBottom: '0.4rem' }}>
          <span className="badge-dot"></span>
          Facebook Video Downloader
        </div>
        
        <h1 className="hero-heading" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', lineHeight: 1.15, marginBottom: '0.25rem' }}>
          Download Facebook Reels
        </h1>
        
        <p className="hero-subheading subtitle" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', maxWidth: '480px' }}>
          Paste the link below to extract your video instantly.
        </p>

        {/* Mascot */}
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

      {/* Downloader Card */}
      <div id="downloader-card-anchor" className="downloader-card-container">
        <div 
          className="clay-card downloader-card spotlight-card"
          onMouseMove={handleCardMouseMove}
        >
          <div className="spotlight-glow" />

          {/* Form and Input Section (Always Visible) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', zIndex: 2, width: '100%' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Paste Facebook URL</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Enter a valid public Facebook reel or video link to pull the stream container.
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="clay-input-wrapper">
                <span className="input-icon-left">
                  <DownloadCloud size={20} />
                </span>
                
                <label htmlFor="facebook-url-input" style={{ display: 'none' }}>
                  Facebook Video URL
                </label>
                <input
                  type="text"
                  id="facebook-url-input"
                  className="clay-input"
                  placeholder="https://www.facebook.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  aria-label="Facebook Video URL"
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
                <span className="demo-title">Try Public Facebook Presets</span>
                <div className="demo-chips">
                  <button
                    className="demo-chip"
                    onClick={() => handleSelectDemo('https://www.facebook.com/reel/123456789012345')}
                  >
                    Public Reel 🎬
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
                  className="loader-wrapper"
                  style={{ width: '100%', padding: '1rem 0' }}
                >
                  <div className="clay-loader-sphere" />
                  <div className="loader-status-container">
                    <span className="loader-step" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      Preparing your download...
                    </span>
                  </div>
                </motion.div>
              )}

              {/* B. ERROR STATE */}
              {!isLoading && errorDetails && (
                <motion.div
                  key="error-state-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ width: '100%' }}
                >
                  <ErrorState 
                    errorType={errorDetails.type}
                    customMessage={errorDetails.message}
                    platform="facebook"
                    onReset={() => {
                      setErrorDetails(null);
                      setUrl('');
                    }}
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
                  {/* Left Column: Media Preview & Meta details */}
                  <div className="success-preview-column">
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
                      {reelData.duration && (
                        <span className="thumbnail-duration">{reelData.duration}</span>
                      )}
                    </div>

                    {/* Platform Badge */}
                    <div className="media-platform-badge facebook-badge">
                      <span className="badge-dot" style={{ background: '#1877f2' }}></span>
                      Facebook Video
                    </div>

                    {/* Creator Account Card */}
                    <div className="creator-profile-mini">
                      <div className="creator-avatar-clay-mini">
                        <img 
                          src={reelData.avatarUrl} 
                          alt="" 
                          className="creator-avatar-mini" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                          }}
                        />
                      </div>
                      <div className="creator-meta-mini">
                        <span className="creator-username-mini">@{reelData.username}</span>
                        {reelData.verified && <CheckCircle size={12} className="verified-icon-mini" />}
                      </div>
                    </div>

                    {/* Short Caption */}
                    <p className="media-caption-mini" title={reelData.caption}>
                      {reelData.caption ? (reelData.caption.length > 80 ? reelData.caption.substring(0, 77) + '...' : reelData.caption) : 'Enjoy this public Facebook video.'}
                    </p>

                    {/* Quality Count Tag */}
                    <div className="quality-count-tag">
                      <Sparkles size={12} style={{ color: 'var(--primary-color)' }} />
                      <span>3 Download Formats Ready</span>
                    </div>
                  </div>

                  {/* Right Column: Download Actions & Quality selectors */}
                  <div className="success-details-column">
                    <h4 className="quality-title-saas-premium">Select Download Quality</h4>
                    
                    <div className="quality-grid-saas-premium">
                      {/* Best Quality Card */}
                      <div 
                        className={`clay-card quality-card-saas-premium card-best-premium ${activeQuality === 'BEST' ? 'active' : ''}`} 
                        onClick={() => handleDownloadQuality('BEST')}
                        style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                      >
                        <div className="quality-header-premium">
                          <span className="quality-badge-saas-premium badge-best-premium">Best</span>
                          <span className="quality-res-saas-premium">High (1080p)</span>
                        </div>
                        <div className="quality-meta-info-premium">
                          <span className="quality-size-saas-premium">Est. Size: {reelData.highSize || calculateSize(reelData.duration, 'BEST')}</span>
                          <span className="quality-format-premium">MP4 Format</span>
                        </div>
                      </div>

                      {/* HD Quality Card */}
                      <div 
                        className={`clay-card quality-card-saas-premium card-hd-premium ${activeQuality === 'HD' ? 'active' : ''}`} 
                        onClick={() => handleDownloadQuality('HD')}
                        style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                      >
                        <div className="quality-header-premium">
                          <span className="quality-badge-saas-premium badge-hd-premium">HD</span>
                          <span className="quality-res-saas-premium">Medium (720p)</span>
                        </div>
                        <div className="quality-meta-info-premium">
                          <span className="quality-size-saas-premium">Est. Size: {reelData.mediumSize || calculateSize(reelData.duration, 'HD')}</span>
                          <span className="quality-format-premium">MP4 Format</span>
                        </div>
                      </div>

                      {/* SD Quality Card */}
                      <div 
                        className={`clay-card quality-card-saas-premium card-sd-premium ${activeQuality === 'SD' ? 'active' : ''}`} 
                        onClick={() => handleDownloadQuality('SD')}
                        style={isDownloading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                      >
                        <div className="quality-header-premium">
                          <span className="quality-badge-saas-premium badge-sd-premium">SD</span>
                          <span className="quality-res-saas-premium">Standard (480p)</span>
                        </div>
                        <div className="quality-meta-info-premium">
                          <span className="quality-size-saas-premium">Est. Size: {reelData.lowSize || calculateSize(reelData.duration, 'SD')}</span>
                          <span className="quality-format-premium">MP4 Format</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Group */}
                    <div className="success-actions-premium" style={{ marginTop: '1.5rem' }}>
                      <div className="download-options-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                          onClick={() => handleDownloadMedia(reelData.thumbnailUrl, `savetube_fb_${reelData.id || 'video'}_cover.jpg`)}
                        >
                          <Download size={16} /> Download Cover Image
                        </button>
                      </div>

                      <div className="btn-back-container" style={{ marginTop: '1rem' }}>
                        <button 
                          className="btn-back"
                          onClick={() => {
                            setReelData(null);
                            setUrl('');
                            setErrorDetails(null);
                            setDownloadSuccessData(null);
                            setActiveQuality('BEST');
                          }}
                        >
                          <ArrowLeft size={16} /> Reset Form
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* D. SUCCESS DOWNLOAD STATE */}
              {!isLoading && downloadSuccessData && (
                <motion.div
                  key="download-success-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  style={{ width: '100%' }}
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

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Animated downloaded counter */}
      <AnimatedCounter target={8249} />

      {/* Local Statistics/Analytics Dashboard */}
      <AnalyticsCards stats={stats} />

      {/* Recent Downloads Section */}
      <section id="history-section-anchor" className="history-section">
        <div className="history-header">
          <h2 className="history-heading">Recent Facebook Downloads</h2>
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
                    <div className="history-user-info" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                      <span className="history-username">@{item.username}</span>
                      {item.quality && (
                        <span className="history-quality-tag">{item.quality}</span>
                      )}
                      <span className="history-date" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {new Date(item.timestamp || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
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
                      title="Quick Download Again"
                      onClick={() => {
                        const qKey = (item.quality || '').includes('480') ? 'SD' : (item.quality || '').includes('720') ? 'HD' : 'BEST';
                        handleDownloadMedia(item.videoUrl, `savetube_fb_${item.id}_${qKey.toLowerCase()}.mp4`, qKey);
                      }}
                      aria-label={`Quick Download again for ${item.username}`}
                    >
                      <Download size={14} />
                    </button>

                    <button
                      className="btn-history-action"
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
                    : 'Your Facebook download history is currently empty.'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Unlock Ad Modal */}
      <UnlockModal 
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlock={handleUnlockComplete}
        qualityName={pendingQuality ? pendingQuality.label : ''}
      />

      {/* Mobile Action Sheet Drawer */}
      <MobileActionSheet 
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        reelData={reelData}
        onDownloadClick={() => {
          if (reelData) {
            handleDownloadQuality('BEST');
          }
        }}
        onCopyCaption={() => handleCopyCaption(reelData?.caption)}
        onCopyHashtags={() => handleCopyHashtags(reelData?.caption)}
        onShareClick={handleShareApp}
        onViewHistory={() => {
          setIsMobileSheetOpen(false);
          const el = document.getElementById('history-section-anchor');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Toast Alert Notification Stack */}
      <div className="toasts-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-clay">
            <span className={`toast-icon ${t.type}`}>
              {t.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FacebookDownloader;
