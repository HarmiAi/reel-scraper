import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Clock, ArrowRight, Search, Tag, BookOpen, Sparkles, SlidersHorizontal } from 'lucide-react';
import { blogPosts } from '../data/blogPosts.js';
import SeoManager from './SeoManager.jsx';

const BlogHub = ({ navigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState(null);

  // Extract all unique categories
  const categories = useMemo(() => {
    const cats = new Set(blogPosts.map((post) => post.category));
    return ['All', ...Array.from(cats)];
  }, []);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    blogPosts.forEach((post) => {
      post.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).slice(0, 12);
  }, []);

  // Filter posts dynamically
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesTag = !selectedTag || post.tags.includes(selectedTag);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [searchQuery, selectedCategory, selectedTag]);

  // Latest 3 posts
  const latestPosts = useMemo(() => {
    return [...blogPosts].slice(0, 3);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div 
      className="page-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '1140px', margin: '0 auto', padding: '1.5rem 1rem' }}
    >
      <SeoManager 
        title="The Save Tube Blog - Free Video Downloader Guides"
        description="Read tutorials, step-by-step guides, and tips on downloading Facebook Reels and Instagram Reels offline. Get expert media tips on The Save Tube today."
        canonicalPath="/blog"
      />

      {/* Blog Hub Hero with premium mesh styling */}
      <section className="hero-section" style={{ marginBottom: '2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '2.5rem 1.25rem', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(97, 208, 122, 0.02) 0%, rgba(97, 208, 122, 0.06) 100%)', border: '1px solid rgba(97, 208, 122, 0.12)', boxShadow: 'var(--shadow-surface-raised)' }}>
        <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: 'var(--primary-color)', filter: 'blur(80px)', opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: 'var(--primary-color)', filter: 'blur(80px)', opacity: 0.12, pointerEvents: 'none' }} />
        
        <div className="hero-badge" style={{ marginBottom: '0.75rem', margin: '0 auto' }}>
          <span className="badge-dot" style={{ background: 'var(--primary-color)' }}></span>
          The Save Tube Blog v2.0
        </div>
        <h1 className="hero-heading text-gradient" style={{ fontSize: 'clamp(1.85rem, 5vw, 2.6rem)', marginBottom: '0.65rem', fontWeight: 900 }}>
          Creator Guides &amp; Tutorials
        </h1>
        <p className="hero-subheading subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Master offline media curation, format resolutions, and download processes. Verified, expert insights for video editors and creators.
        </p>
      </section>

      {/* Main Grid: Left = Search Filters + Cards, Right = Sidebar */}
      <div className="blog-cols-desktop-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="blog-cols-desktop-grid">
        
        {/* Left Column: Filter controls + Blog Post Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Categories Horizontal Pills Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedTag(null); }}
                className={`btn-clay ${selectedCategory === cat ? 'btn-clay-primary' : 'btn-clay-secondary'}`}
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.82rem', height: '36px', borderRadius: 'var(--radius-full)' }}
              >
                {cat}
              </button>
            ))}
            
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="btn-clay btn-clay-primary"
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.82rem', height: '36px', borderRadius: 'var(--radius-full)', background: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}
              >
                Tag: #{selectedTag} &times;
              </button>
            )}
          </div>

          {/* Cards Grid */}
          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <motion.article 
                    key={post.slug} 
                    className="clay-card blog-hub-card"
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', cursor: 'pointer', padding: '0' }}
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    {/* Featured Image */}
                    <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span className="quality-badge-saas-premium badge-best-premium" style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2 }}>
                        {post.category}
                      </span>
                    </div>

                    {/* Content Area */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      {/* Meta Date/Read-Time */}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Calendar size={11} /> {post.publishDate}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={11} /> {post.readingTime}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                        {post.title}
                      </h3>

                      {/* Short description */}
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem', flexGrow: 1 }}>
                        {post.description.substring(0, 115)}...
                      </p>

                      {/* Footer Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0, 0, 0, 0.04)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <User size={11} style={{ color: 'var(--primary-color)' }} /> {post.author.split(' ')[0]}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                          Read Guide <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <motion.div 
                  layout
                  className="clay-card" 
                  style={{ gridColumn: '1 / -1', padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}
                >
                  <BookOpen size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.5, color: 'var(--primary-color)' }} />
                  <h4>No guides found matching your filters</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try clearing the search query or selecting a different category.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="blog-sidebar-sticky" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Search Box Card */}
          <div className="clay-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Search Articles
            </h4>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search keywords, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', height: '42px', padding: '0 1rem 0 2.25rem', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.01)', fontSize: '0.85rem', color: 'var(--text-primary)' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6 }} />
            </div>
          </div>

          {/* Download CTA Banner Card */}
          <div className="clay-card banner-card-clay" style={{ padding: '1.5rem 1.25rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(97, 208, 122, 0.03) 100%)', border: '1px solid rgba(97, 208, 122, 0.2)' }}>
            <span className="banner-badge-clay">Free Web Tools</span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', marginTop: '0.4rem' }}>
              Save Video Clips
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              Extract Facebook or Instagram Reels instantly in original resolutions without watermarks.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn-clay btn-clay-primary" onClick={() => navigate('/instagram')} style={{ width: '100%', height: '38px', fontSize: '0.82rem' }}>
                Instagram Downloader
              </button>
              <button className="btn-clay btn-clay-secondary" onClick={() => navigate('/facebook')} style={{ width: '100%', height: '38px', fontSize: '0.82rem' }}>
                Facebook Downloader
              </button>
            </div>
          </div>

          {/* Latest Posts Widget */}
          <div className="clay-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Latest Guides
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {latestPosts.map((lp) => (
                <div 
                  key={lp.slug} 
                  style={{ display: 'flex', gap: '0.6rem', cursor: 'pointer' }}
                  onClick={() => { navigate(`/blog/${lp.slug}`); window.scrollTo(0,0); }}
                >
                  <img src={lp.featuredImage} alt="" style={{ width: '60px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-primary)', lineHeight: 1.25 }}>{lp.title.substring(0, 36)}...</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{lp.publishDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags cloud Widget */}
          <div className="clay-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Popular Topics
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {allTags.map((tag) => (
                <span 
                  key={tag} 
                  onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setSelectedCategory('All'); }}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: selectedTag === tag ? 'var(--primary-color)' : 'var(--bg-card-secondary)', border: '1px solid rgba(0,0,0,0.03)', color: selectedTag === tag ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 650 }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

        </aside>
        
      </div>
    </motion.div>
  );
};

export default BlogHub;
