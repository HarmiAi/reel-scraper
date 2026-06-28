import axios from 'axios';
import fs from 'fs';

const url = 'https://www.instagram.com/p/CdmYaq3LAYo/embed/';

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
  };

  try {
    const res = await axios.get(url, { headers, timeout: 5000 });
    console.log('STATUS:', res.status);
    console.log('LENGTH:', res.data.length);
    
    fs.writeFileSync('embed_clean.html', res.data);
    
    // Check if it contains the video URL
    const unescaped = res.data.replace(/\\/g, '');
    const mp4Matches = unescaped.match(/https:\/\/[^"'\s]*\.mp4[^"'\s]*/gi) || [];
    console.log('MP4 matches:', mp4Matches.length);
    if (mp4Matches.length > 0) {
      console.log('Found MP4 URL:', mp4Matches[0]);
    }

  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
