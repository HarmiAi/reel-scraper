import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Validates Facebook Reel or Video URLs
 * Matches: facebook.com/reel/... or facebook.com/watch/... or fb.watch/... or facebook.com/.../videos/...
 */
export const validateFacebookUrl = (url) => {
  if (!url) return false;
  const cleanedUrl = url.trim();
  const facebookRegex = /^(https?:\/\/)?(www\.|m\.)?(facebook\.com|fb\.watch|fb\.com)\/(reel|watch|.*\/videos|share\/r|share\/v|share)\/?(\?v=\d+)?([A-Za-z0-9_.-]+)?\/?(\?.*)?$/i;
  const containsFacebook = cleanedUrl.includes('facebook.com') || cleanedUrl.includes('fb.watch') || cleanedUrl.includes('fb.com');
  return facebookRegex.test(cleanedUrl) || (containsFacebook && cleanedUrl.length > 15);
};

export const parseFacebookId = (url) => {
  try {
    const cleanedUrl = url.trim().replace(/\/$/, "");
    const parts = cleanedUrl.split("/");
    const id = parts[parts.length - 1].split('?')[0];
    if (id) return id;
  } catch (e) {
    console.error("Error parsing facebook id", e);
  }
  return 'facebook_video_' + Math.random().toString(36).substring(2, 8);
};

export const fetchFacebookData = async (url) => {
  if (!validateFacebookUrl(url)) {
    throw new Error("Invalid Facebook URL. Please check the format and try again.");
  }
  const response = await api.post('/api/facebook/extract', { url: url.trim() });
  return response.data;
};

export const downloadFacebookFile = async (videoUrl, fileName = 'lumina_facebook.mp4', quality = 'BEST', id = '') => {
  if (!videoUrl) return false;
  try {
    const proxyUrl = `${API_BASE_URL}/api/facebook/downloadProxy?url=${encodeURIComponent(videoUrl)}&name=${encodeURIComponent(fileName)}&quality=${quality.toUpperCase()}&id=${encodeURIComponent(id)}`;
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
