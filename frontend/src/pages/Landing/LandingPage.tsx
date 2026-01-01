import React, { useEffect } from 'react';
import LandingNavbar from './components/LandingNavbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import AboutUs from './components/AboutUs';
import Footer from './components/Footer';

export default function LandingPage() {
  // Ensure we start at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
      <LandingNavbar />
      <Hero />
      <HowItWorks />
      <Features />
      <AboutUs />
      <Footer />
    </div>
  );
}
