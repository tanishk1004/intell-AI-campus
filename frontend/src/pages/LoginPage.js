import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setError('');
    if (role === 'admin') setForm({ email: 'admin@intellicampus.ai', password: 'Admin@123' });
    else setForm({ email: 'student@intellicampus.ai', password: 'Student@123' });
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 sm:w-96 h-80 sm:h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 sm:w-96 h-80 sm:h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan mb-3 sm:mb-4">
            <SparklesIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to IntelliCampus AI+</p>
        </div>

        {/* Demo buttons */}
        <div className="flex gap-3 mb-5 sm:mb-6">
          <button onClick={() => fillDemo('admin')}
            className="flex-1 py-2 text-xs bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl hover:bg-brand-500/20 transition-all">
            🔑 Demo Admin
          </button>
          <button onClick={() => fillDemo('student')}
            className="flex-1 py-2 text-xs bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan rounded-xl hover:bg-accent-cyan/20 transition-all">
            🎓 Demo Student
          </button>
        </div>

        <div className="glass-card p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors text-sm"
                placeholder="you@campus.edu" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors pr-12 text-sm"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1">
                  {showPass ? <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5 sm:mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Register</Link>
          </p>
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-slate-500 mt-4">
          No backend needed · Works 100% in browser
        </p>
      </motion.div>
    </div>
  );
}
