import React, { useState, useEffect } from 'react';
import { Header } from '../components/landing/Header';
import { HeroSlider } from '../components/landing/HeroSlider';
import { ImpactStats } from '../components/landing/ImpactStats';
import { QuickServicesBar } from '../components/landing/QuickServicesBar';
import { CampusLife } from '../components/landing/CampusLife';
import { NewsSection } from '../components/landing/NewsSection';
import { UpcomingEvents } from '../components/landing/UpcomingEvents';
import { AcademicsHub } from '../components/landing/AcademicsHub';
import { ExploreCampuses } from '../components/landing/ExploreCampuses';
import { Partners } from '../components/landing/Partners';
import { FinalCTA } from '../components/landing/FinalCTA';
import { Footer } from '../components/landing/Footer';
import { QuickContactFloating } from '../components/landing/QuickContactFloating';
import { Modals } from '../components/landing/Modals';
import { translations } from '../data/translations';
import '../styles/landing.css';

export default function LandingPage() {
  const [lang, setLang] = useState(() => localStorage.getItem('suc_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('suc_theme') || 'light');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [searchQueryParent, setSearchQueryParent] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('suc_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('suc_lang', lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const openModal = (modalName) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  const t = translations[lang] || translations.en;

  return (
    <div className="landing-page-wrapper">
      <Header 
        lang={lang} 
        setLang={setLang} 
        t={t} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        openModal={openModal} 
        setSearchQueryParent={setSearchQueryParent}
      />

      <HeroSlider t={t} openModal={openModal} />

      <ImpactStats t={t} openModal={openModal} />

      <QuickServicesBar t={t} openModal={openModal} />

      <CampusLife t={t} openModal={openModal} />

      <NewsSection t={t} openModal={openModal} />

      <UpcomingEvents t={t} openModal={openModal} />

      <AcademicsHub t={t} openModal={openModal} setSelectedProgram={setSelectedProgram} />

      <ExploreCampuses t={t} openModal={openModal} />

      <Partners t={t} />

      <FinalCTA t={t} openModal={openModal} />

      <Footer t={t} openModal={openModal} />

      <QuickContactFloating />

      <Modals 
        activeModal={activeModal} 
        closeModal={closeModal} 
        t={t} 
        selectedProgram={selectedProgram}
        searchQuery={searchQueryParent}
      />
    </div>
  );
}
