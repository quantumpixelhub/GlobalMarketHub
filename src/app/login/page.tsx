'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useCSRFToken } from '@/hooks/useCSRFToken';

export default function LoginPage() {
  const router = useRouter();
  const { token: csrfToken, sessionId, refreshToken, handleError } = useCSRFToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({
          ...formData,
          _csrf: csrfToken,
          _session_id: sessionId,
        }),
      });

      const data = await res.json();

      // Handle CSRF token validation error
      if (res.status === 403) {
        const wasStale = await handleError(res);
        if (wasStale) {
          setError('Security token expired. Please try again.');
          return;
        }
      }

      if (res.ok) {
        // Store token
        localStorage.setItem('token', data.token);
        alert('Login successful!');
        router.push(data.user?.role === 'ADMIN' ? '/admin/analytics' : '/products');
      } else {
        setError(data.error || data.message || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4 py-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute top-24 right-[-3.5rem] h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute bottom-[-5rem] left-1/3 h-[22rem] w-[22rem] rounded-full bg-rose-500/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.15),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.16),transparent_34%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.55)] p-6 md:p-7">
          {/* Header */}
          <div className="text-center mb-5">
            <Logo size="xl" imageSrc="/logo-trimmed.png" className="justify-center mb-1" />
            <p className="text-slate-600 text-sm md:text-base">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white/95 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white/95 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 disabled:bg-gray-400 text-white font-bold py-2.5 rounded-lg transition duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/95 text-slate-500">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-slate-600 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-rose-600 hover:text-rose-700 font-semibold">
                Create one now
              </Link>
            </p>
          </div>

          {/* Test Credentials Info */}
          <div className="mt-6 p-4 bg-rose-50/90 border border-rose-200 rounded-lg">
            <p className="text-rose-800 text-xs font-semibold mb-2">Demo Credentials:</p>
            <p className="text-rose-700 text-xs">
              Admin Email: quantumpixelhub@gmail.com<br />
              Admin Password: admin@quantumhub
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/90 text-sm mt-6">
          Need help?{' '}
          <a href="#" className="underline hover:text-white">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
