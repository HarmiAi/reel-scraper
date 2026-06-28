import React from 'react';
import { Helmet } from 'react-helmet-async';

const SeoManager = ({ 
  title, 
  description, 
  canonicalPath, 
  robots = 'index, follow', 
  pageType = 'website',
  schemaData = null
}) => {
  const fullUrl = `https://thesavetube.com${canonicalPath || '/'}`;
  const displayTitle = title ? `${title} | The Save Tube` : 'The Save Tube - Free Video & Reel Downloader';

  // Base organization schema
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Save Tube",
    "url": "https://thesavetube.com",
    "logo": "https://thesavetube.com/favicon.svg",
    "sameAs": [
      "https://twitter.com/thesavetube",
      "https://facebook.com/thesavetube"
    ]
  };

  return (
    <Helmet>
      {/* 1. Standard Metadata */}
      <title>{displayTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={fullUrl} />

      {/* 2. Open Graph Tags */}
      <meta property="og:site_name" content="The Save Tube" />
      <meta property="og:type" content={pageType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title || 'The Save Tube'} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800" />

      {/* 3. Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || 'The Save Tube'} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800" />

      {/* 4. JSON-LD Structured Data Injection */}
      <script type="application/ld+json">
        {JSON.stringify(orgSchema)}
      </script>

      {schemaData && (
        Array.isArray(schemaData) ? (
          schemaData.map((schema, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(schemaData)}
          </script>
        )
      )}
    </Helmet>
  );
};

export default SeoManager;
