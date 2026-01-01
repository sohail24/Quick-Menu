import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              QuickMenu
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} QuickMenu. All rights reserved.
            </p>
          </div>

          <div className="flex gap-8">
            <Link to="#" className="text-gray-500 hover:text-blue-600 transition">Privacy Policy</Link>
            <Link to="#" className="text-gray-500 hover:text-blue-600 transition">Terms of Service</Link>
            <Link to="#" className="text-gray-500 hover:text-blue-600 transition">Contact Support</Link>
          </div>

        </div>
      </div>
    </footer>
  );
}
