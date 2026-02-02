import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../app/store';
import { ChevronLeft } from 'lucide-react';

export default function DemoSelection() {
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  async function performDemoLogin(role: 'admin' | 'staff') {
    setLoading(true);
    try {
      const email = role === 'admin' ? 'admin@quickmenu.local' : 'staff@quickmenu.local';
      const password = role === 'admin' ? 'Admin123!' : 'Staff123!';
      
      const res = await api.post('/api/auth/login', { email, password });
      const token = res.data.token;
      
      if (!token) throw new Error('No token returned');
      
      setToken(token);
      
      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/staff');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex flex-col relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4"></div>

      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col items-center justify-center">
        
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Home
            </button>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              Choose your Demo Experience
            </h1>
            <p className="text-lg text-gray-500">
              Select a role below to instantly access a live environment. No password required.
            </p>
          </div>

          <div className="space-y-4">
            {/* Admin Role */}
            <button
              type="button"
              onClick={() => performDemoLogin('admin')}
              disabled={loading}
              className="w-full p-5 bg-white border border-blue-100 rounded-[24px] text-left hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden active:scale-98"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                  🏢
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">Restaurant Admin</div>
                  <div className="text-sm text-gray-400 font-medium">Full access to dashboard, menu editing & analytics</div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <span className="font-bold text-lg">→</span>
                    </div>
                </div>
              </div>
            </button>

            {/* Staff Role */}
            <button
              type="button"
              onClick={() => performDemoLogin('staff')}
              disabled={loading}
              className="w-full p-5 bg-white border border-indigo-100 rounded-[24px] text-left hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden active:scale-98"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                  🧑‍🍳
                </div>
                 <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">Kitchen Staff</div>
                  <div className="text-sm text-gray-400 font-medium">View live orders, manage status & kitchen flow</div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <span className="font-bold text-lg">→</span>
                    </div>
                </div>
              </div>
            </button>

             <div className="pt-6 text-center">
                 <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                     Powered by QuickMenu
                 </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
