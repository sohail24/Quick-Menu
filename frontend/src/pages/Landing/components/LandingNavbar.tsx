import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          QuickMenu
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('howitworks')} className="text-gray-600 hover:text-blue-600 font-medium transition">How it Works</button>
          <button onClick={() => scrollTo('features')} className="text-gray-600 hover:text-blue-600 font-medium transition">Features</button>
          <button onClick={() => scrollTo('about')} className="text-gray-600 hover:text-blue-600 font-medium transition">About Us</button>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Log In</Link>
          <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition shadow-lg shadow-blue-600/20">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
