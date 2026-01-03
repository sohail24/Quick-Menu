// src/pages/Auth/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../app/store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(email, password);
  }

  async function doLogin(e: string, p: string) {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email: e, password: p });
      const token = res.data.token;
      if (!token) throw new Error('No token returned');
      setToken(token);
      alert('Login successful');
      navigate('/menu/demo');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleDemoAdmin() {
    doLogin('admin@quickmenu.local', 'Admin123!');
  }

  function handleDemoStaff() {
    doLogin('staff@quickmenu.local', 'Staff123!');
  }

  return (
    <div className="min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white relative">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

      {/* Left Column: Login Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:p-12 order-1 lg:order-1 relative z-10 min-h-[500px] lg:min-h-0">
        <div className="w-full max-sm:max-w-xs max-w-sm">
          <div className="mb-8">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:scale-105 transition-transform inline-block">
              QuickMenu
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-6 mb-2">Welcome back.</h1>
            <p className="text-sm text-gray-400 font-medium tracking-tight">Enter your details to access your dashboard</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all py-2.5"
              />
              <div className="space-y-1.5">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all py-2.5"
                />
                <div className="flex justify-end">
                  <Link to="/forgot-password" title="Reset your password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>
            
            <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/20 transition-all mt-2" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-gray-400 pt-6 font-medium">
              New here?{' '}
              <Link to="/signup" className="text-blue-600 font-bold hover:underline underline-offset-4 decoration-2">
                Start Free Trial
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Demo Access */}
      <div className="bg-blue-50/30 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-12 order-2 lg:order-2 border-t lg:border-t-0 lg:border-l border-blue-50 relative z-10 backdrop-blur-sm min-h-[400px] lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-[11px] font-bold uppercase tracking-widest mb-3">
              Quick Test
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2 leading-tight">Pick a demo account to instantly explore.</h2>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              No registration needed. Select a role below to see how QuickMenu works for different users.
            </p>
          </div>

          <div className="space-y-3">
            {/* Admin Role */}
            <button
              type="button"
              onClick={handleDemoAdmin}
              disabled={loading}
              className="w-full p-4 sm:p-5 bg-white border border-blue-100 rounded-[28px] text-left hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                  🏢
                </div>
                <div>
                  <div className="font-extrabold text-gray-900 text-base sm:text-lg">Demo Admin</div>
                  <div className="text-xs text-gray-400 font-medium">Manage restaurants & menus</div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-bold text-xs text-blue-600">
                  TRY →
                </div>
              </div>
            </button>

            {/* Staff Role */}
            <button
              type="button"
              onClick={handleDemoStaff}
              disabled={loading}
              className="w-full p-4 sm:p-5 bg-white border border-indigo-100 rounded-[28px] text-left hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                  🧑‍💼
                </div>
                <div>
                  <div className="font-extrabold text-gray-900 text-base sm:text-lg">Demo Staff</div>
                  <div className="text-xs text-gray-400 font-medium">Handle service & orders</div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-bold text-xs text-indigo-600">
                  TRY →
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center lg:text-left opacity-30">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
              PREMIUM CONTACTLESS DINING
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

