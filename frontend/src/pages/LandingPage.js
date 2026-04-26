import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SparklesIcon, BoltIcon, ChartBarIcon,
  ChatBubbleLeftRightIcon, ShieldCheckIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';

const features = [
  { icon: BoltIcon, title: 'AI Room Prediction', desc: 'Predict room availability with 85%+ accuracy using ML models', color: 'from-brand-500 to-accent-purple' },
  { icon: ShieldCheckIcon, title: 'Smart Complaints', desc: 'NLP auto-classifies complaints as Critical/High/Medium/Low', color: 'from-accent-cyan to-brand-500' },
  { icon: ChatBubbleLeftRightIcon, title: 'AI Chatbot', desc: 'Context-aware campus assistant answers queries instantly', color: 'from-accent-green to-accent-cyan' },
  { icon: ChartBarIcon, title: 'Live Analytics', desc: 'Real-time heatmaps, usage trends, and AI-powered insights', color: 'from-accent-yellow to-accent-red' },
];

const stats = [
  { value: '85%', label: 'Prediction Accuracy' },
  { value: '3x', label: 'Faster Complaint Resolution' },
  { value: '60%', label: 'Better Room Utilization' },
  { value: '24/7', label: 'AI Assistant Uptime' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-dark-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-white">IntelliCampus</span>
            <span className="text-brand-400 font-bold"> AI+</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</Link>
          <Link to="/register" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/25">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-6">
            <SparklesIcon className="w-4 h-4" />
            Powered by AI & Machine Learning
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-tight">
            The{' '}
            <span className="gradient-text">Autonomous AI Brain</span>
            <br />for Smart Campuses
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Predict room availability, auto-classify complaints, optimize resources,
            and get instant AI assistance — all in one intelligent platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-brand-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              Launch Platform
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-dark-700 border border-dark-500 text-white font-semibold rounded-2xl hover:border-brand-500/50 transition-all duration-300"
            >
              View Demo
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16"
        >
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-5 text-center">
              <div className="text-3xl font-extrabold gradient-text">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 lg:px-12 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything Your Campus Needs</h2>
          <p className="text-slate-400">AI-powered features that transform campus operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="glass-card p-6 hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto glass-card p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Campus?</h2>
          <p className="text-slate-400 mb-8">Join the AI revolution in campus management</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-brand-500/30 transition-all duration-300"
          >
            Get Started Free
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 text-center py-6 text-slate-500 text-sm border-t border-dark-500">
        © 2024 IntelliCampus AI+ — Built for the Future of Education
      </footer>
    </div>
  );
}
