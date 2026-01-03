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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -z-1 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 -z-1 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4"></div>

      {/* Left Column: Login Form */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 order-2 lg:order-1 relative z-10">
        <div className="w-full max-sm:max-w-xs max-w-sm">
          <div className="mb-12">
            <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:scale-105 transition-transform inline-block">
              QuickMenu
            </Link>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mt-10 mb-3">Welcome back.</h1>
            <p className="text-gray-500 font-medium tracking-tight">Enter your details to access your dashboard</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all py-3"
              />
              <div className="space-y-2">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all py-3"
                />
                <div className="flex justify-end">
                  <Link to="/forgot-password" title="Reset your password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>
            
            <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/20 transition-all" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-gray-500 pt-8 font-medium">
              New here?{' '}
              <Link to="/signup" className="text-blue-600 font-bold hover:underline underline-offset-4 decoration-2">
                Start Free Trial
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Demo Access */}
      <div className="bg-blue-50/30 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 order-1 lg:order-2 border-l border-blue-50 relative z-10 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">
              Quick Test
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">Pick a demo account to <br/> instantly explore.</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              No registration needed. Select a role below to see how QuickMenu works for different users.
            </p>
          </div>

          <div className="space-y-4">
            {/* Admin Role */}
            <button
              type="button"
              onClick={handleDemoAdmin}
              disabled={loading}
              className="w-full p-6 bg-white border border-blue-100 rounded-[32px] text-left hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden active:scale-95"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                  👑
                </div>
                <div>
                  <div className="font-extrabold text-gray-900 text-xl">Demo Admin</div>
                  <div className="text-sm text-gray-400 font-medium">Manage restaurants & menus</div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-bold text-sm text-blue-600">
                  TRY →
                </div>
              </div>
            </button>

            {/* Staff Role */}
            <button
              type="button"
              onClick={handleDemoStaff}
              disabled={loading}
              className="w-full p-6 bg-white border border-indigo-100 rounded-[32px] text-left hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden active:scale-95"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                  🥘
                </div>
                <div>
                  <div className="font-extrabold text-gray-900 text-xl">Demo Staff</div>
                  <div className="text-sm text-gray-400 font-medium">Handle service & orders</div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-bold text-sm text-indigo-600">
                  TRY →
                </div>
              </div>
            </button>
          </div>

          <div className="mt-12 text-center lg:text-left opacity-30">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
              PREMIUM CONTACTLESS DINING
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
