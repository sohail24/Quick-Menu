import React, { useEffect, useState } from 'react';
import LandingNavbar from './components/LandingNavbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('home');

  // Ensure we start at top and trigger backend wakeup
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Proactive backend wakeup (no need to await)
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://quick-menu-dq9o.onrender.com';
    fetch(`${backendUrl}/api/health`).catch(() => {});
  }, []);

  // Intersection Observer for ScrollSpy
  useEffect(() => {
    const sections = ['howitworks', 'features', 'about'];
    
    const handleScroll = () => {
      if (window.scrollY < 300) {
        setActiveSection('home');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // More biased towards the top-middle of the screen
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Only update if we're not at the very top
      if (window.scrollY >= 300) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 pb-20 md:pb-0">
      <LandingNavbar activeSection={activeSection} />
      <Hero />
      <HowItWorks />
      <Features />
      <AboutUs />
      <Footer />
      <MobileNav activeSection={activeSection} />
    </div>
  );
}
