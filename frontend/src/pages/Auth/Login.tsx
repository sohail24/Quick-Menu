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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

      <Card className="w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-4">
          <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent inline-block mb-2">
            QuickMenu
          </Link>
          <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your details to access your dashboard</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
             placeholder="••••••••"
            required
          />
          
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>
          
          <Button className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">Quick Demo Access</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDemoAdmin}
              disabled={loading}
              className="py-2 px-4 border border-gray-300 rounded-2xl text-sm font-black text-white-700 hover:bg-gray-100 hover:border-gray-700 transition-all active:scale-95 flex flex-col items-center justify-center shadow-sm"
            >
              <span className="text-[10px] uppercase tracking-widest opacity-70">Log in as</span>
              Demo Admin
            </button>
            <button
              type="button"
              onClick={handleDemoStaff}
              disabled={loading}
              className="py-2 px-4 border border-gray-300 rounded-2xl text-sm font-black text-white-700 hover:bg-gray-100 hover:border-gray-700 transition-all active:scale-95 flex flex-col items-center justify-center shadow-sm"
            >
              <span className="text-[10px] uppercase tracking-widest opacity-70">Log in as</span>
              Demo Staff
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-2">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">
              Start Free Trial
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
