import React from 'react';
import { newsArticles } from '../../data/universityData';
import { Calendar, ArrowUpRight } from 'lucide-react';

export function NewsSection({ t, openModal }) {
  const featured = newsArticles.find((item) => item.isFeatured) || newsArticles[0];
  const sideArticles = newsArticles.filter((item) => item.id !== featured.id).slice(0, 3);

  return (
    <section className="aau-news-section bg-white" id="news">
      <div className="container-wrapper">
        {/* AAU STANDARDIZED SECTION HEADER WITH TWO-TONE ACCENT */}
        <div className="aau-section-header">
          <span className="aau-eyebrow-small">Institutional News</span>
          <h2 className="aau-title-heading">{t.whatsNewTitle || "What's New"}</h2>
          <div className="aau-dual-line">
            <span className="line-red" />
            <span className="line-blue" />
          </div>
        </div>

        {/* AAU ASYMMETRIC 1+3 NEWS GRID */}
        <div className="aau-news-grid">
          {/* LEFT COLUMN: LARGE FEATURED STORY */}
          <div className="aau-news-featured">
            <div className="aau-featured-img-wrap">
              <img src={featured.image} alt={featured.title} className="aau-featured-img" />
              <span className="aau-news-badge">{featured.category}</span>
            </div>

            <div className="aau-featured-content">
              <div className="aau-news-meta">
                <Calendar size={13} style={{ color: 'var(--red-accent)', marginRight: '4px' }} />
                <span>{featured.date}</span>
                <span className="meta-dot">•</span>
                <span>{featured.author}</span>
              </div>

              <h3 className="aau-featured-title">
                {featured.title}
              </h3>

              <p className="aau-featured-excerpt">
                {featured.excerpt}
              </p>

              <button 
                className="btn-aau-primary"
                onClick={() => openModal('portalModal')}
                style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
              >
                Read Story <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: 3 STACKED SIDE STORIES */}
          <div className="aau-news-side-stack">
            {sideArticles.map((article) => (
              <div 
                key={article.id} 
                className="aau-news-side-item"
                onClick={() => openModal('portalModal')}
              >
                <img src={article.image} alt={article.title} className="aau-side-thumb" />
                <div className="aau-side-body">
                  <div className="aau-news-meta">
                    <span className="aau-side-category">{article.category}</span>
                    <span className="meta-dot">•</span>
                    <span>{article.date}</span>
                  </div>

                  <h4 className="aau-side-title">
                    {article.title}
                  </h4>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '12px' }}>
              <button 
                className="btn-aau-blue-wide" 
                onClick={() => openModal('portalModal')}
              >
                {(t.btnViewAllNews || 'VIEW MORE NEWS ↗').replace('↗', '').trim()} <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
