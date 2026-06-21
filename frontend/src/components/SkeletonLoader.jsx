import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="skeleton-loader success-card">
      {/* Media Thumbnail Column Skeleton */}
      <div className="skeleton-thumbnail success-thumbnail-wrapper pulsing-skeleton" />

      {/* Meta Details Column Skeleton */}
      <div className="success-details skeleton-details">
        {/* Creator */}
        <div className="creator-profile skeleton-profile">
          <div className="creator-avatar-clay skeleton-avatar pulsing-skeleton" />
          <div className="creator-meta skeleton-meta">
            <div className="skeleton-line skeleton-title pulsing-skeleton" />
            <div className="skeleton-line skeleton-subtitle pulsing-skeleton" style={{ width: '60%', marginTop: '0.4rem' }} />
          </div>
        </div>

        {/* Caption */}
        <div className="success-caption skeleton-caption-box">
          <div className="skeleton-line pulsing-skeleton" style={{ width: '90%' }} />
          <div className="skeleton-line pulsing-skeleton" style={{ width: '80%', marginTop: '0.5rem' }} />
          <div className="skeleton-line pulsing-skeleton" style={{ width: '40%', marginTop: '0.5rem' }} />
        </div>

        {/* Stats Grid */}
        <div className="reel-statistics-grid skeleton-stats">
          <div className="stat-item-clay skeleton-stat-item pulsing-skeleton" style={{ height: '52px' }} />
          <div className="stat-item-clay skeleton-stat-item pulsing-skeleton" style={{ height: '52px' }} />
          <div className="stat-item-clay skeleton-stat-item pulsing-skeleton" style={{ height: '52px' }} />
        </div>

        {/* Actions */}
        <div className="success-actions skeleton-actions">
          <div className="skeleton-btn pulsing-skeleton" style={{ height: '48px', borderRadius: 'var(--radius-md)' }} />
          <div className="download-options-group">
            <div className="skeleton-btn pulsing-skeleton" style={{ height: '42px', borderRadius: 'var(--radius-md)', flex: 1 }} />
            <div className="skeleton-btn pulsing-skeleton" style={{ height: '42px', borderRadius: 'var(--radius-md)', flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
