import axios from 'axios';

/**
 * Lumina Reels — Instagram Downloader Service Layer (Axios Powered)
 * 
 * Communicates with the Express backend to extract real Instagram Reel metadata
 * and stream the files directly to the user's hard drive bypassing CORS limitations.
 */

// Create Axios Instance with dynamic Base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Validates whether a URL matches the Instagram Reel format.
 * Matches: instagram.com/reel/... or instagram.com/p/... or instagram.com/tv/...
 * Supports mobile subdomains like (m., or www.)
 * @param {string} url - The URL to validate
 * @returns {boolean}
 */
export const validateReelUrl = (url) => {
  if (!url) return false;
  const cleanedUrl = url.trim();
  const instagramRegex = /^(https?:\/\/)?(www\.|m\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/i;
  return instagramRegex.test(cleanedUrl);
};

/**
 * Parses the shortcode (ID) of the reel from the URL
 */
export const parseShortcode = (url) => {
  try {
    const cleanedUrl = url.trim().replace(/\/$/, ""); // remove trailing slash
    const parts = cleanedUrl.split("/");
    const indexOfReel = parts.findIndex(p => p === 'reel' || p === 'p' || p === 'tv');
    if (indexOfReel !== -1 && parts[indexOfReel + 1]) {
      return parts[indexOfReel + 1].split('?')[0];
    }
  } catch (e) {
    console.error("Error parsing shortcode", e);
  }
  return 'instagram_reel_' + Math.random().toString(36).substring(2, 8);
};

/**
 * Fetches real extraction data from the backend Express server
 * 
 * @param {string} url - Validated Instagram URL
 * @returns {Promise<object>} - Real Reel Metadata from backend
 */
export const fetchReelData = async (url) => {
  if (!validateReelUrl(url)) {
    throw new Error("Invalid Instagram URL. Please check the format and try again.");
  }

  try {
    // POST request to backend Express controller via Axios
    const response = await api.post('/api/reels/extract', { url: url.trim() });
    return response.data;
  } catch (err) {
    console.error('[Axios Service] Extraction request failed:', err);
    const errorMessage = err.response?.data?.error || err.message || 'Failed to extract reel media. Please ensure the link is public and try again.';
    throw new Error(errorMessage);
  }
};

/**
 * Downloads a video file by routing it through our backend downloadProxy.
 * This completely circumvents client-side browser CORS blocking of Instagram CDN servers,
 * forcing a direct download to disk.
 * 
 * @param {string} videoUrl - Direct Instagram CDN URL
 * @param {string} fileName - File name to save as
 * @returns {Promise<boolean>}
 */
export const downloadVideoFile = async (videoUrl, fileName = 'lumina_reel.mp4', quality = 'BEST', id = '') => {
  if (!videoUrl) return false;
  
  try {
    // Generate proxy URL using the absolute backend baseURL
    const proxyUrl = `${API_BASE_URL}/api/reels/downloadProxy?url=${encodeURIComponent(videoUrl)}&name=${encodeURIComponent(fileName)}&quality=${quality.toUpperCase()}&id=${encodeURIComponent(id)}`;
    
    // Create an anchor node, trigger download click programmatically
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.setAttribute('target', '_self');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("Failed to route download via proxy, falling back to direct tab", err);
    window.open(videoUrl, '_blank');
    return false;
  }
};
