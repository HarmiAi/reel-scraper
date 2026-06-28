import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Calendar, User, Clock, ArrowLeft, ArrowRight, ChevronDown, Share2, Clipboard, Link, ChevronRight, CheckCircle } from 'lucide-react';
import { blogPosts } from '../data/blogPosts.js';
import SeoManager from './SeoManager.jsx';

const BlogPost = ({ slug, navigate }) => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Find current post
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h2>Article Not Found</h2>
        <p>The requested blog post could not be located.</p>
        <button className="btn-clay btn-clay-primary" onClick={() => navigate('/blog')}>
          Back to Blog
        </button>
      </div>
    );
  }

  // Find related/next/prev posts
  const currentIndex = blogPosts.findIndex((p) => p.slug === post.slug);
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const relatedPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleShareClick = () => {
    const articleUrl = `https://thesavetube.com/blog/${post.slug}`;
    navigator.clipboard.writeText(articleUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Structured schemas
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": post.featuredImage,
    "datePublished": "2026-06-28T00:00:00+00:00",
    "dateModified": "2026-06-28T00:00:00+00:00",
    "author": {
      "@type": "Person",
      "name": post.author,
      "url": "https://thesavetube.com/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Save Tube",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thesavetube.com/favicon.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://thesavetube.com/blog/${post.slug}`
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faq.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  const breadcrumbSchema = {
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
        "name": "Blog",
        "item": "https://thesavetube.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://thesavetube.com/blog/${post.slug}`
      }
    ]
  };

  const combinedSchemas = [blogSchema, faqSchema, breadcrumbSchema];

  return (
    <div className="page-container" style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Reading Progress Bar */}
      <motion.div 
        style={{ 
          scaleX, 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '4px', 
          background: 'var(--primary-color)', 
          transformOrigin: '0%', 
          zIndex: 1000 
        }} 
      />
      <SeoManager 
        title={post.title}
        description={post.description}
        canonicalPath={`/blog/${post.slug}`}
        pageType="article"
        schemaData={combinedSchemas}
      />
      
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
        <ChevronRight size={12} />
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/blog')}>Blog</span>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{post.category}</span>
      </nav>

      {/* Back button */}
      <button className="btn-back" onClick={() => navigate('/blog')} style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to Blog List
      </button>

      {/* Main Grid */}
      <div className="blog-post-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
        
        {/* Render columns on desktop */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="blog-cols-desktop-grid">
            
            {/* Left Column: Article Content */}
            <article style={{ flex: '1' }}>
              <div className="clay-card page-card" style={{ padding: '2rem 1.5rem' }}>
                {/* Category & Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className="quality-badge-saas-premium badge-best-premium">{post.category}</span>
                  {post.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-card-secondary)', border: '1px solid rgba(0,0,0,0.03)', color: 'var(--text-secondary)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: 1.25 }}>
                  {post.title}
                </h1>

                {/* Author row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={14} style={{ color: 'var(--primary-color)' }} /> {post.author}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> {post.publishDate}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} /> {post.readingTime}
                  </span>
                </div>

                {/* Featured Image */}
                <div style={{ width: '100%', maxHeight: '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '2.25rem' }}>
                  <img src={post.featuredImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Table of Contents for SEO */}
                <div className="clay-card policy-toc-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
                  <span className="policy-toc-title">Guide Navigation</span>
                  <ul className="policy-toc-list">
                    <li><a href="#introduction">Introduction</a></li>
                    <li><a href="#steps">Step-by-Step Tutorial</a></li>
                    <li><a href="#features">Key Product Features</a></li>
                    <li><a href="#faqs">Frequently Asked Questions</a></li>
                  </ul>
                </div>

                {/* Article Body */}
                <div 
                  id="introduction"
                  className="policy-doc-content" 
                  dangerouslySetInnerHTML={{ __html: post.content }} 
                />

                {/* Social Share Callout */}
                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Share this guide:</span>
                  <button 
                    onClick={handleShareClick}
                    className="btn-clay btn-clay-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {copiedLink ? <span style={{ color: 'var(--primary-color)' }}>Copied link!</span> : <><Share2 size={12} /> Copy Article URL</>}
                  </button>
                </div>
              </div>
            </article>

            {/* Right Column: Sticky Sidebar with Tools Callout */}
            <aside className="blog-sidebar-sticky" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Author Profile Card (EEAT & Credibility) */}
              <div className="clay-card" style={{ padding: '1.25rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" 
                    alt="Harmi Pagada" 
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
                  />
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Harmi Pagada</h5>
                    <span style={{ fontSize: '0.68rem', color: 'var(--primary-color)', fontWeight: 700 }}>Senior Media Specialist</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  Harmi Pagada is a Senior Full-Stack Engineer and Media Processing Specialist with 8+ years of experience building high-performance social scrapers and CDN delivery workflows.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(97, 208, 122, 0.08)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(97, 208, 122, 0.15)' }}>
                  <CheckCircle size={10} style={{ color: 'var(--primary-color)' }} />
                  <span>Editorially Reviewed &amp; Fact-checked</span>
                </div>
              </div>

              {/* Tool Download Card */}
              <div className="clay-card banner-card-clay" style={{ padding: '1.75rem 1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(97, 208, 122, 0.05) 100%)', border: '1px solid rgba(97, 208, 122, 0.2)' }}>
                <span className="banner-badge-clay">Free Online Tool</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                  Download Reels Instantly
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Save public reels from Instagram or Facebook directly to your device without sign-ups or watermarks.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button className="btn-clay btn-clay-primary" onClick={() => navigate('/instagram')} style={{ width: '100%', height: '44px', fontSize: '0.9rem' }}>
                    Instagram Downloader
                  </button>
                  <button className="btn-clay btn-clay-secondary" onClick={() => navigate('/facebook')} style={{ width: '100%', height: '44px', fontSize: '0.9rem' }}>
                    Facebook Downloader
                  </button>
                </div>
              </div>

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className="clay-card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    Related Guides
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {relatedPosts.map((rp) => (
                      <div 
                        key={rp.slug} 
                        style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}
                        onClick={() => {
                          navigate(`/blog/${rp.slug}`);
                          window.scrollTo(0, 0);
                        }}
                      >
                        <img src={rp.featuredImage} alt="" style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{rp.title.substring(0, 42)}...</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{rp.publishDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
            
          </div>

          {/* FAQ Page Structured Data Section */}
          <section id="faqs" className="clay-card page-card" style={{ padding: '2rem 1.5rem', marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              FAQ - Frequently Asked Questions
            </h2>
            <div className="faq-accordions-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {post.faq.map((item, index) => (
                <div 
                  key={index} 
                  className={`clay-card faq-accordion-item ${activeFaq === index ? 'active' : ''}`}
                  style={{ padding: '0', overflow: 'hidden', background: activeFaq === index ? 'var(--bg-card)' : 'rgba(0,0,0,0.01)' }}
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: 750, fontSize: '0.92rem', color: 'var(--text-primary)', paddingRight: '1rem' }}>{item.question}</span>
                    <ChevronDown size={16} style={{ transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--primary-color)', flexShrink: 0 }} />
                  </button>
                  {activeFaq === index && (
                    <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '0.75rem' }}>
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Navigation footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            {prevPost ? (
              <button className="btn-clay btn-clay-secondary" onClick={() => { navigate(`/blog/${prevPost.slug}`); window.scrollTo(0,0); }} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowLeft size={14} /> Previous Guide
              </button>
            ) : <div />}
            {nextPost ? (
              <button className="btn-clay btn-clay-secondary" onClick={() => { navigate(`/blog/${nextPost.slug}`); window.scrollTo(0,0); }} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                Next Guide <ArrowRight size={14} />
              </button>
            ) : <div />}
          </div>

        </div>

      </div>
    </div>
  );
};

export default BlogPost;
