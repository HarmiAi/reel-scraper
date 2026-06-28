import axios from 'axios';
import fs from 'fs';

const url = 'https://www.instagram.com/reel/CdmYaq3LAYo/embed/captioned/';

async function testEmbed() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  try {
    const res = await axios.get(url, { headers, timeout: 5000 });
    const html = res.data;
    
    // Search for mp4 links
    const mp4Regex = /https:\/\/[^"'\s]*\.mp4[^"'\s]*/gi;
    const mp4Matches = html.match(mp4Regex) || [];
    console.log('MP4 Matches found:', mp4Matches.length);
    mp4Matches.slice(0, 5).forEach((m, idx) => console.log(`MP4 [${idx}]:`, m.substring(0, 150)));

    // Search for jpg links
    const jpgRegex = /https:\/\/[^"'\s]*\.jpg[^"'\s]*/gi;
    const jpgMatches = html.match(jpgRegex) || [];
    console.log('JPG Matches found:', jpgMatches.length);
    jpgMatches.slice(0, 5).forEach((m, idx) => console.log(`JPG [${idx}]:`, m.substring(0, 150)));

    // Write html to file to inspect if needed
    fs.writeFileSync('embed_response.html', html);
    console.log('Saved embed_response.html');

  } catch (err) {
    console.log('Failed:', err.message);
  }
}

testEmbed();
