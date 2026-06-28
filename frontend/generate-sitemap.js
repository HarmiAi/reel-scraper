import fs from 'fs';
import path from 'path';

// Resolve directory paths
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dataPath = path.join(process.cwd(), 'src', 'data', 'blogPosts.json');
const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

// Load blog posts
let blogPosts = [];
try {
  const fileData = fs.readFileSync(dataPath, 'utf-8');
  blogPosts = JSON.parse(fileData);
} catch (e) {
  console.warn('Could not read blogPosts.json database for sitemap generation. Generating with empty posts.', e.message);
}

// Today's date for sitemap
const today = new Date().toISOString().split('T')[0];

const staticUrls = [
  { loc: 'https://thesavetube.com/', priority: '1.00', freq: 'daily' },
  { loc: 'https://thesavetube.com/instagram', priority: '0.90', freq: 'daily' },
  { loc: 'https://thesavetube.com/facebook', priority: '0.90', freq: 'daily' },
  { loc: 'https://thesavetube.com/blog', priority: '0.80', freq: 'weekly' },
  { loc: 'https://thesavetube.com/about', priority: '0.60', freq: 'monthly' },
  { loc: 'https://thesavetube.com/contact', priority: '0.60', freq: 'monthly' },
  { loc: 'https://thesavetube.com/privacy-policy', priority: '0.40', freq: 'yearly' },
  { loc: 'https://thesavetube.com/terms-of-service', priority: '0.40', freq: 'yearly' }
];

let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

// Add static URLs
staticUrls.forEach((url) => {
  xmlContent += `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.freq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
});

// Add dynamic blog URLs
blogPosts.forEach((post) => {
  xmlContent += `
  <url>
    <loc>https://thesavetube.com/blog/${post.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`;
});

xmlContent += '\n</urlset>';

// Write sitemap file
fs.writeFileSync(sitemapPath, xmlContent, 'utf-8');
console.log(`[Sitemap Generator] Successfully generated sitemap.xml with ${staticUrls.length} static URLs and ${blogPosts.length} dynamic blog post URLs at: ${sitemapPath}`);
