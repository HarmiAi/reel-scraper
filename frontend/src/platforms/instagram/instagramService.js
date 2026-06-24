import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const validateInstagramUrl = (url) => {
  if (!url) return false;
  const cleanedUrl = url.trim();
  const instagramRegex = /^(https?:\/\/)?(www\.|m\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/i;
  return instagramRegex.test(cleanedUrl);
};

export const parseInstagramShortcode = (url) => {
  try {
    const cleanedUrl = url.trim().replace(/\/$/, "");
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

export const fetchInstagramReelData = async (url) => {
  if (!validateInstagramUrl(url)) {
    throw new Error("Invalid Instagram URL. Please check the format and try again.");
  }
  const response = await api.post('/api/reels/extract', { url: url.trim() });
  return response.data;
};

export const downloadInstagramVideoFile = async (videoUrl, fileName = 'savetube_reel.mp4', quality = 'BEST', id = '') => {
  if (!videoUrl) return false;
  try {
    const proxyUrl = `${API_BASE_URL}/api/reels/downloadProxy?url=${encodeURIComponent(videoUrl)}&name=${encodeURIComponent(fileName)}&quality=${quality.toUpperCase()}&id=${encodeURIComponent(id)}`;
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.setAttribute('target', '_self');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("Failed proxy download, opening CDN directly", err);
    window.open(videoUrl, '_blank');
    return false;
  }
};
