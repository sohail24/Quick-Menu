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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-50 translate-y-1/2 translate-x-1/2"></div>

      <Card className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent inline-block mb-2">
            QuickMenu
          </Link>
          <h2 className="text-xl font-semibold text-gray-900">Start your free trial</h2>
          <p className="text-sm text-gray-500 mt-1">No credit card required. Cancel anytime.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
           <Input
            label="Admin Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ironman3000"
            required
          />
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
            placeholder="Create a strong password"
            required
          />
          
          <Button className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
