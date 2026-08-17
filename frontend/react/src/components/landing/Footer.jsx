import React from 'react';
import { Phone, MapPin, Shield, FileText, Radio } from 'lucide-react';
import sucLogo from '../../assets/SUC_Logo.png';

const TwitterIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YoutubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const LinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
  </svg>
);

const TelegramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .54-1.42.53-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.61 3.99-1.67 4.83-1.96 5.37-1.97.12 0 .38.03.55.17.14.12.18.28.2.43-.02.07-.02.16-.04.28z" />
  </svg>
);

const TiktokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .56.04.83.12V9.35a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.6a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-4.46z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const GithubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export function Footer({ t, openModal }) {
  return (
    <footer className="footer-institutional" id="footer-contact">
      <div className="container-wrapper">
        <div className="footer-5col-grid">
          {/* COL 1: LARGE EMBLEM SEAL & AMHARIC / ENGLISH TITLE */}
          <div className="footer-brand-column">
            <img
              src={sucLogo}
              alt="Sheba University College Official Emblem"
              className="footer-brand-seal-large"
            />

            <div className="footer-radio-inline">
              <Radio size={16} className="radio-icon" />
              <span>Stay Tuned 99.4FM</span>
            </div>
          </div>

          {/* COL 2: Essentials */}
          <div>
            <h4 className="footer-col-title-plain">Essentials</h4>
            <ul className="footer-links-list">
              <li><a href="#footer-contact" onClick={(e) => { e.preventDefault(); openModal('applyModal'); }}>Contact us</a></li>
              <li><a href="#campus-life">Media Gallery</a></li>
              <li><a href="#events" onClick={(e) => { e.preventDefault(); openModal('portalModal'); }}>Emergency Services</a></li>
              <li><a href="#news">Archive</a></li>
            </ul>
          </div>

          {/* COL 3: About us */}
          <div>
            <h4 className="footer-col-title-plain">About us</h4>
            <ul className="footer-links-list">
              <li><a href="#about" onClick={(e) => { e.preventDefault(); openModal('bioModal'); }}>History</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); openModal('bioModal'); }}>Leadership</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); openModal('bioModal'); }}>Presidents</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); openModal('bioModal'); }}>Overview</a></li>
            </ul>
          </div>

          {/* COL 4: Resources */}
          <div>
            <h4 className="footer-col-title-plain">Resources</h4>
            <ul className="footer-links-list">
              <li><a href="#events">Events</a></li>
              <li><a href="#downloads">Documents</a></li>
              <li><a href="#news">Publications</a></li>
              <li><a href="#downloads">Services</a></li>
              <li><a href="#academics">Programs A to Z</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('privacyModal'); }}>Privacy Policy</a></li>
            </ul>
          </div>

          {/* COL 5: Quick links */}
          <div>
            <h4 className="footer-col-title-plain">Quick links</h4>
            <ul className="footer-links-list">
              <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('portalModal'); }}>Portal</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('portalModal'); }}>E-learning</a></li>
              <li><a href="#campus-life">Campus Life</a></li>
              <li><a href="#academics">Staff</a></li>
            </ul>
          </div>
        </div>

        {/* FOOTER BOTTOM ROW WITH DIVIDER LINE */}
        <div className="footer-bottom-row">
          <div className="footer-bottom-flex">

            {/* SOCIAL MEDIA ICONS BAR */}
            <div className="aau-social-bar">
              <a href="https://x.com/sheba_official" target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                <TwitterIcon size={18} />
              </a>
              <a href="https://youtube.com/@sheba-university" target="_blank" rel="noopener noreferrer" title="YouTube">
                <YoutubeIcon size={18} />
              </a>
              <a href="https://facebook.com/sheba-university" target="_blank" rel="noopener noreferrer" title="Facebook">
                <FacebookIcon size={18} />
              </a>
              <a href="https://linkedin.com/company/sheba-university" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <LinkedinIcon size={18} />
              </a>
              <a href="https://t.me/sheba_university_college" target="_blank" rel="noopener noreferrer" title="Telegram">
                <TelegramIcon size={18} />
              </a>
              <a href="https://tiktok.com/@sheba_university" target="_blank" rel="noopener noreferrer" title="TikTok">
                <TiktokIcon size={18} />
              </a>
              <a href="https://instagram.com/sheba_university" target="_blank" rel="noopener noreferrer" title="Instagram">
                <InstagramIcon size={18} />
              </a>
              <a href="https://github.com/julas-core/" target="_blank" rel="noopener noreferrer" title="Github">
                <GithubIcon size={18} />
              </a>
            </div>

            <div className="footer-copyright">
              © 2026 Sheba University College. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
