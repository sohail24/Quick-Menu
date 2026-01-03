// src/pages/Auth/Signup.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../app/store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/signup', { name, email, password });
      const token = res.data.token;
      if (!token) throw new Error('No token returned');
      setToken(token);
      navigate('/menu/demo');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] lg:h-[calc(100dvh-64px)] lg:overflow-hidden flex items-center justify-center p-6 bg-white selection:bg-blue-50 relative overflow-x-hidden">
      {/* Background patterns clipped inside a container */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4"></div>
      </div>

      <div className="w-full max-sm:max-w-xs max-w-sm relative z-10 py-4">
        <div className="text-center sm:text-left mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Create account.</h1>
          <p className="text-sm text-gray-400 font-medium tracking-tight">No credit card required. Cancel anytime.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-4">
            <Input
              label="Admin Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. johndoe"
              required
              className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all py-2.5"
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all py-2.5"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all py-2.5"
            />
          </div>

          <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/20 transition-all mt-2" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Joining...</span>
              </div>
            ) : 'Create Account'}
          </Button>

          <div className="text-center text-sm text-gray-500 pt-6 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline underline-offset-4 decoration-2">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
