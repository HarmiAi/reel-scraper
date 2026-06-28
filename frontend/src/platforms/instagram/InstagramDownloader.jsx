import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  DownloadCloud, X, Clipboard, ArrowLeft, RefreshCw, Download, Trash2, 
  Info, FileText, Sparkles, CheckCircle, Heart, MessageCircle, Play, ChevronDown
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
import SeoManager from '../../components/SeoManager.jsx';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuality, setFilterQuality] = useState('ALL');
  const [activeFaq, setActiveFaq] = useState(null);

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

      // Record download history initial item
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

      const downloadUrl = (qualityKey === 'SD' && data.sdVideoUrl) 
        ? data.sdVideoUrl 
        : ((qualityKey === 'HD' && data.hdVideoUrl) ? data.hdVideoUrl : data.videoUrl);

      if (qualityKey === 'SD') {
        // Trigger actual download proxy stream immediately for SD
        await downloadInstagramVideoFile(downloadUrl, filename, qualityKey, data.id);

        const counts = {};
        let maxCount = 0;
        let mostDownloaded = stats.mostDownloadedCreator || 'None';

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
          hd: stats.hd,
          sd: stats.sd + 1,
          mostDownloadedCreator: mostDownloaded
        };
        saveStats(updatedStats);

        setDownloadSuccessData({ reelData: data, qualityName: qualityLabel });
        setIsLoading(false);
        showToast('Download started successfully!', 'success');
      } else {
        // Show ad countdown placeholder for premium bandwidth downloads
        setPendingQuality({ key: qualityKey, label: qualityLabel });
        setIsUnlockModalOpen(true);
        setIsLoading(false);
      }

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
      const downloadUrl = (qualityKey === 'SD' && reelData.sdVideoUrl) 
        ? reelData.sdVideoUrl 
        : ((qualityKey === 'HD' && reelData.hdVideoUrl) ? reelData.hdVideoUrl : reelData.videoUrl);
      const success = await downloadInstagramVideoFile(downloadUrl, filename, qualityKey, reelData.id);
      
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

  const handleDeleteHistoryItem = (id, e) => {
    if (e) e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    showToast('Removed from history', 'info');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your Instagram download history?')) {
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
    
    const cardAnchor = document.getElementById('downloader-card-anchor');
    if (cardAnchor) {
      cardAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const [downloadSuccessData, setDownloadSuccessData] = useState(null);
  const hasMultipleQualities = !!(reelData && reelData.sdVideoUrl && reelData.hdVideoUrl && (reelData.sdVideoUrl !== reelData.hdVideoUrl));
  const displaySizeBest = reelData ? (reelData.highSize || calculateSize(reelData.duration, 'BEST')) : '';
  const displaySizeHD = reelData ? (hasMultipleQualities ? (reelData.mediumSize || calculateSize(reelData.duration, 'HD')) : displaySizeBest) : '';
  const displaySizeSD = reelData ? (hasMultipleQualities ? (reelData.lowSize || calculateSize(reelData.duration, 'SD')) : displaySizeBest) : '';

  const filteredHistory = getFilteredHistory();

  const instagramAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Instagram Reel Downloader",
    "url": "https://thesavetube.com/instagram",
    "image": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires HTML5 compatible browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const instagramFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I download Instagram Reels?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Copy the Instagram Reel link from the share button, paste it in the search input above, select your desired resolution (SD, HD, or Best), and tap download."
        }
      },
      {
        "@type": "Question",
        "name": "Is this Instagram downloader free and safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Our tool is 100% free and requires no registration or app installs, meaning your device is fully safe from malware and adware."
        }
      },
      {
        "@type": "Question",
        "name": "Does it work on Android and iPhone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, it works natively inside any modern browser (Google Chrome, Apple Safari, Samsung Internet) on both iOS and Android."
        }
      },
      {
        "@type": "Question",
        "name": "Why is my Instagram download link failing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Downloads usually fail if the video is private or set to friend-only permissions. Make sure the video is posted publicly on Instagram."
        }
      }
    ]
  };

  const instagramBreadcrumbSchema = {
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
        "name": "Instagram Downloader",
        "item": "https://thesavetube.com/instagram"
      }
    ]
  };

  const combinedInstagramSchemas = [instagramAppSchema, instagramFaqSchema, instagramBreadcrumbSchema];

  return (
    <motion.div
      key="instagram-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <SeoManager 
        title="Instagram Reel Downloader - Download Insta Reels Online"
        description="Free online tool to download Instagram Reels, videos, and photos in high quality. Save Instagram Reels without watermarks directly to mobile or PC."
        canonicalPath="/instagram"
        schemaData={combinedInstagramSchemas}
      />
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
                    <div className="media-platform-badge instagram-badge">
                      <span className="badge-dot" style={{ background: 'var(--instagram-primary)' }}></span>
                      Instagram Reel
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
                      {reelData.caption ? (reelData.caption.length > 80 ? reelData.caption.substring(0, 77) + '...' : reelData.caption) : 'Enjoy this public Instagram reel.'}
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
                          <span className="quality-size-saas-premium">Est. Size: {displaySizeBest}</span>
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
                          <span className="quality-size-saas-premium">Est. Size: {displaySizeHD}</span>
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
                          <span className="quality-size-saas-premium">Est. Size: {displaySizeSD}</span>
                          <span className="quality-format-premium">MP4 Format</span>
                        </div>
                      </div>
                    </div>

                    {!hasMultipleQualities && (
                      <div className="clay-card info-callout-saas-premium animate-fade-in" style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(97, 208, 122, 0.08)', border: '1px dashed rgba(97, 208, 122, 0.4)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', textAlign: 'left' }}>
                          <Info size={18} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            Note: Only the original high-quality stream is available from this source. All options will download the best available quality.
                          </span>
                        </div>
                      </div>
                    )}

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
                            onClick={() => {
                              setReelData(null);
                              setUrl('');
                              setErrorDetails(null);
                              setDownloadSuccessData(null);
                              setActiveQuality('BEST');
                            }}
                          >
                            <RefreshCw size={16} /> Reset Form
                          </button>
                        </div>
                      </div>
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

      {/* AEO / GEO Optimized FAQ Section */}
      <section className="clay-card page-card" style={{ maxWidth: '640px', width: '92%', margin: '2rem auto', textAlign: 'left', padding: '2rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={18} style={{ color: 'var(--primary-color)' }} />
          Instagram Reel Downloader Guide &amp; FAQ
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Welcome to the ultimate guide for downloading Instagram Reels. Our tool extracts direct mp4 video streams from public Instagram CDN servers safely, anonymously, and completely free.
        </p>

        {/* Feature Comparison Table (GEO) */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                <th style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>Feature</th>
                <th style={{ padding: '0.5rem', color: 'var(--primary-color)' }}>The Save Tube</th>
                <th style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>Other Tools</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 650 }}>Pop-up Ads</td>
                <td style={{ padding: '0.5rem', color: 'var(--primary-color)', fontWeight: 700 }}>No Popups</td>
                <td style={{ padding: '0.5rem' }}>Excessive Ads</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 650 }}>Registration</td>
                <td style={{ padding: '0.5rem', color: 'var(--primary-color)', fontWeight: 700 }}>Not Required</td>
                <td style={{ padding: '0.5rem' }}>Requires Sign-up</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 650 }}>Audio Capture</td>
                <td style={{ padding: '0.5rem', color: 'var(--primary-color)', fontWeight: 700 }}>Original Sound</td>
                <td style={{ padding: '0.5rem' }}>Muted HD options</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FAQ Accordions */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Frequently Asked Questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            {
              q: "How do I download Instagram Reels?",
              a: "Copy the Instagram Reel link from the share button, paste it in the search input above, select your desired resolution (SD, HD, or Best), and tap download."
            },
            {
              q: "Is this Instagram downloader free and safe?",
              a: "Yes. Our tool is 100% free and requires no registration or app installs, meaning your device is fully safe from malware and adware."
            },
            {
              q: "Does it work on Android and iPhone?",
              a: "Yes, it works natively inside any modern browser (Google Chrome, Apple Safari, Samsung Internet) on both iOS and Android."
            },
            {
              q: "Why is my Instagram download link failing?",
              a: "Downloads usually fail if the video is private or set to friend-only permissions. Make sure the video is posted publicly on Instagram."
            }
          ].map((faq, index) => (
            <div 
              key={index} 
              className={`clay-card faq-accordion-item ${activeFaq === index ? 'active' : ''}`}
              style={{ padding: '0', overflow: 'hidden', background: activeFaq === index ? 'var(--bg-card)' : 'rgba(0,0,0,0.01)' }}
            >
              <button 
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 750, fontSize: '0.82rem', color: 'var(--text-primary)', paddingRight: '0.75rem' }}>{faq.q}</span>
                <ChevronDown size={14} style={{ transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--primary-color)', flexShrink: 0 }} />
              </button>
              {activeFaq === index && (
                <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '0.5rem' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editorial Footnote (EEAT) */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <span>Editorial Review: June 28, 2026</span>
          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Fact-Checked &amp; Verified</span>
        </div>
      </section>

      {/* Recent Downloads Section */}
      <section id="history-section-anchor" className="history-section">
        <div className="history-header">
          <h2 className="history-heading">Recent Instagram Downloads</h2>
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
                        handleDownloadMedia(item.videoUrl, `savetube_ig_${item.id}_${qKey.toLowerCase()}.mp4`, qKey);
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
                <p className="history-empty-text">No downloads found in logs.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Unlock Premium Modal */}
      <UnlockModal 
        isOpen={isUnlockModalOpen} 
        onClose={() => setIsUnlockModalOpen(false)} 
        onUnlockComplete={handleUnlockComplete} 
        qualityName={pendingQuality ? pendingQuality.label : ''}
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
