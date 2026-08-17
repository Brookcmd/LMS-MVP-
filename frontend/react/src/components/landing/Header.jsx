import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronDown, Search, Menu, X, LogIn, Moon, Sun, Radio } from 'lucide-react';
import logo from '../../assets/SUC_Logo.png';

export function Header({ lang, setLang, t, theme, toggleTheme, openModal, setSearchQueryParent }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (setSearchQueryParent) {
        setSearchQueryParent(searchQuery);
      }
      setSearchOpen(false);
      openModal('notFoundModal');
    }
  };

  return (
    <header className="aau-header-wrapper">
      {/* TOP UTILITY BAR (Tier 1) */}
      <div className="aau-top-utility-bar">
        <div className="aau-top-utility-container">
          <div className="aau-top-left-announcement">
            <Radio size={14} className="aau-radio-pulse" />
            <span>Stay Tuned 99.4 FM Sheba Broadcast • Admissions 2026/27 Open</span>
          </div>

          <div className="aau-top-right-actions">
            <a href="#home" className="aau-top-utility-link" title="Home">
              <Home size={15} /> <span>Home</span>
            </a>

            <button
              className="aau-top-utility-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search Website"
            >
              <Search size={15} /> <span>Search</span>
            </button>

            <div className="aau-top-lang-wrap">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="aau-top-lang-select"
                aria-label="Select Language"
              >
                <option value="en">EN</option>
                <option value="am">አማ</option>
                <option value="ti">ትግ</option>
              </select>
            </div>

            <button
              className="aau-top-utility-btn"
              onClick={toggleTheme}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--red-accent-light)' }} /> : <Moon size={15} />}
            </button>

            <button
              className="btn-aau-top-login"
              onClick={() => navigate('/login')}
            >
              <LogIn size={14} /> Sign In
            </button>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR (Tier 2) */}
      <nav className="aau-navbar">
        <div className="aau-brand-wrap">
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <img
            src={logo}
            alt="Sheba University College Emblem"
            className="aau-nav-logo"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />

          <div className="aau-brand-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="aau-brand-amharic">ሽባ ዩኒቨርሲቲ ኮሌጅ</div>
            <div className="aau-brand-english">SHEBA UNIVERSITY COLLEGE</div>
            <div className="aau-brand-since">SINCE 1999</div>
          </div>
        </div>

        {/* AAU MAIN DROPDOWN NAVIGATION MENU */}
        <ul className={`aau-nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li className="aau-dropdown-item">
            <a href="#about" className="aau-nav-link" onClick={() => openModal('bioModal')}>
              About <ChevronDown size={14} />
            </a>
          </li>
          <li className="aau-dropdown-item">
            <a href="#academics" className="aau-nav-link" onClick={() => openModal('applyModal')}>
              Admissions <ChevronDown size={14} />
            </a>
          </li>
          <li className="aau-dropdown-item">
            <a href="#academics" className="aau-nav-link">
              Academics <ChevronDown size={14} />
            </a>
          </li>
          <li className="aau-dropdown-item">
            <a href="#events" className="aau-nav-link">
              Research <ChevronDown size={14} />
            </a>
          </li>
          <li className="aau-dropdown-item">
            <a href="#campuses" className="aau-nav-link">
              Offices <ChevronDown size={14} />
            </a>
          </li>
          <li className="aau-dropdown-item">
            <a href="#downloads" className="aau-nav-link">
              Services <ChevronDown size={14} />
            </a>
          </li>
        </ul>
      </nav>

      {/* SEARCH OVERLAY POPOVER */}
      {searchOpen && (
        <div className="aau-search-popover-bar">
          <form onSubmit={handleSearchSubmit} className="aau-search-popover-form">
            <input
              type="text"
              placeholder="Search Sheba programs, faculties, admissions, Honor Adi-Ha branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="aau-search-popover-input"
              autoFocus
            />
            <button type="submit" className="btn-aau-primary" style={{ padding: '8px 20px' }}>Search</button>
            <button type="button" className="aau-search-close-btn" onClick={() => setSearchOpen(false)}>
              <X size={18} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
