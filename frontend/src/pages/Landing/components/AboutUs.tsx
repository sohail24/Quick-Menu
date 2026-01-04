import React from 'react';
import { Github, Linkedin, Mail, MapPin, Briefcase, GraduationCap, Heart } from 'lucide-react';

export default function AboutUs() {
  return (
    <section id="about" className="py-24 bg-gray-900 text-white relative overflow-hidden min-h-screen ">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Developer Image / Avatar Placeholder */}
            <div className="lg:w-1/3 shrink-0">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[40px] opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-72 h-72 mx-auto bg-gray-800 rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
                  {/* Since I don't have a real photo, I'll use a stylish icon composition */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
                    <div className="w-32 h-32 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/30">
                      <Briefcase className="w-16 h-16" />
                    </div>
                  </div>
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 to-transparent text-center">
                    <div className="text-xl font-black tracking-tight">Sohail Ahmad</div>
                    <div className="text-blue-400 text-sm font-bold uppercase tracking-widest">Developer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="lg:w-2/3 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">About<span className="text-blue-400"> Me</span></h2>
              
              <p className="text-gray-400 text font-medium leading-relaxed mb-10">
                Hi, I’m Sohail, A Software Engineer with 3 years of experience in building scalable and reliable enterprise applications.
                QuickMenu is a personal project where it aims at contactless kiosk ordering system while experimenting with modern backend and frontend technologies
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Role</div>
                    <div className="font-bold">Software Engineer @ Tata Consultancy Services</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Education</div>
                    <div className="font-bold">B.E (Computer Engineer) </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Location</div>
                    <div className="font-bold">Pune, India</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center text-purple-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tech Passion</div>
                    <div className="font-bold">Full Stack Web Apps</div>
                  </div>
                </div>
              </div>

              {/* Tech Stack Section */}
              <div className="mb-12">
                <div className="text-xs text-blue-400 font-black uppercase tracking-[0.2em] mb-8 lg:text-left text-center">Tech stacks used in this project</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Frontend Stack */}
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 lg:text-left text-center">Frontend</div>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                      {[
                        { name: 'React 19', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                        { name: 'TypeScript', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                        { name: 'Tailwind CSS', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
                        { name: 'Zustand', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        { name: 'Recharts', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
                      ].map((tech) => (
                        <span key={tech.name} className={`px-3 py-1.5 rounded-lg border text-[11px] font-black tracking-tight ${tech.color}`}>
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Backend Stack */}
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 lg:text-left text-center">Backend & Security</div>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                      {[
                        { name: 'Java 17', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                        { name: 'Spring Boot 3', color: 'bg-green-500/10 text-green-400 border-green-400/20' },
                        { name: 'Spring Security', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                        { name: 'JWT Auth', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                        { name: 'Web Sockets + STOMP', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
                        { name: 'Swagger / OpenAPI', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                      ].map((tech) => (
                        <span key={tech.name} className={`px-3 py-1.5 rounded-lg border text-[11px] font-black tracking-tight ${tech.color}`}>
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Infrastructure & Services */}
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 lg:text-left text-center">Infrastructure & Services</div>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                       {[
                        { name: 'H2 (Dev)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                        { name: 'PostgreSQL (Live)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                        { name: 'Java Mail (Local)', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                        { name: 'SendGrid (Live)', color: 'bg-blue-400/10 text-blue-300 border-blue-400/20' },
                        { name: 'Cloudinary', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                      ].map((tech) => (
                        <span key={tech.name} className={`px-3 py-1.5 rounded-lg border text-[11px] font-black tracking-tight ${tech.color}`}>
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>


              {/* Social Links Placeholder */}

              {/* Social Links */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <a 
                  href="https://github.com/sohail24/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  <Github className="w-5 h-5" /> Github
                </a>
                <a 
                  href="https://www.linkedin.com/in/sohailahmad24/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all duration-300"
                >
                  <Linkedin className="w-5 h-5" /> LinkedIn
                </a>
                <a 
                  href="mailto:sohailahmadjobs@gmail.com"
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all duration-300"
                >
                  <Mail className="w-5 h-5" /> Contact
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
