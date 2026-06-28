import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const normalizeInstagramUrl = (url) => {
  if (!url) return '';
  let cleaned = url.trim();
  
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch (e) {}

  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    const match = parsed.pathname.match(/\/(?:[a-zA-Z0-9_\.]+\/)?(reel|reels|p|tv|r)\/([A-Za-z0-9_-]+)/i);
    if (match) {
      let type = match[1].toLowerCase();
      if (type === 'r' || type === 'reels') type = 'reel';
      const shortcode = match[2];
      return `https://www.instagram.com/${type}/${shortcode}/`;
    }
  } catch (e) {
    const match = cleaned.match(/(?:instagram\.com)\/(?:[a-zA-Z0-9_\.]+\/)?(reel|reels|p|tv|r)\/([A-Za-z0-9_-]+)/i);
    if (match) {
      let type = match[1].toLowerCase();
      if (type === 'r' || type === 'reels') type = 'reel';
      const shortcode = match[2];
      return `https://www.instagram.com/${type}/${shortcode}/`;
    }
  }

  return '';
};

export const validateInstagramUrl = (url) => {
  const normalized = normalizeInstagramUrl(url);
  if (!normalized) return false;
  return /^https:\/\/www\.instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/$/i.test(normalized);
};

export const parseInstagramShortcode = (url) => {
  const normalized = normalizeInstagramUrl(url);
  if (normalized) {
    const parts = normalized.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
  return 'instagram_reel_' + Math.random().toString(36).substring(2, 8);
};

export const fetchInstagramReelData = async (url) => {
  const normalized = normalizeInstagramUrl(url);
  if (!validateInstagramUrl(url)) {
    throw new Error("Invalid Instagram URL. Please check the format and try again.");
  }
  const response = await api.post('/api/reels/extract', { url: normalized });
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
  } catch (e) {
    console.error("Download proxy call error", e);
    return false;
  }
};
