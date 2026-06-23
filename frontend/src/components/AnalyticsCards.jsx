import React from 'react';
import { Download, Zap, Disc, User } from 'lucide-react';

const AnalyticsCards = ({ stats }) => {
  const { total = 0, hd = 0, sd = 0, mostDownloadedCreator = 'None' } = stats || {};

  return (
    <div className="analytics-grid-saas">
      <div className="clay-card analytic-card-saas">
        <div className="analytic-icon-clay saas-total">
          <Download size={18} />
        </div>
        <div className="analytic-meta-saas">
          <span className="analytic-value-saas">{total}</span>
          <span className="analytic-label-saas">Total Extractions</span>
        </div>
      </div>

      <div className="clay-card analytic-card-saas">
        <div className="analytic-icon-clay saas-hd">
          <Zap size={18} />
        </div>
        <div className="analytic-meta-saas">
          <span className="analytic-value-saas">{hd}</span>
          <span className="analytic-label-saas">HD / Best Premium</span>
        </div>
      </div>

      <div className="clay-card analytic-card-saas">
        <div className="analytic-icon-clay saas-sd">
          <Disc size={18} />
        </div>
        <div className="analytic-meta-saas">
          <span className="analytic-value-saas">{sd}</span>
          <span className="analytic-label-saas">SD Standard</span>
        </div>
      </div>

      <div className="clay-card analytic-card-saas">
        <div className="analytic-icon-clay saas-creator">
          <User size={18} />
        </div>
        <div className="analytic-meta-saas">
          <span className="analytic-value-saas" style={{ fontSize: mostDownloadedCreator.length > 12 ? '0.85rem' : '1.05rem', wordBreak: 'break-all' }}>
            {mostDownloadedCreator}
          </span>
          <span className="analytic-label-saas">Top Creator</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCards;
