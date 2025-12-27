import React from 'react';

export default function AboutUs() {
  return (
    <section id="about" className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="text-3xl font-bold mb-6">About QuickMenu</h2>
        <p className="text-gray-300 text-lg leading-relaxed mb-8">
          We are on a mission to modernize the dining experience. Born from the need for safer, 
          more efficient ordering solutions, QuickMenu empowers restaurant owners with technology 
          that was once only available to big chains. We believe in simplicity, speed, and 
          transparency.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-8 text-center sm:text-left">
           <div>
             <div className="text-4xl font-bold text-blue-400 mb-2">Coming soon </div>
             <div className="text-gray-400">Restaurants Empowered</div>
           </div>
           <div>
             <div className="text-4xl font-bold text-blue-400 mb-2">Coming soon </div>
             <div className="text-gray-400">Orders Processed</div>
           </div>
           <div>
             <div className="text-4xl font-bold text-blue-400 mb-2">Coming soon </div>
             <div className="text-gray-400">Uptime Reliability</div>
           </div>
        </div>
      </div>
    </section>
  );
}
