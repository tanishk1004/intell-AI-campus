import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  HomeIcon, BuildingOfficeIcon, ExclamationCircleIcon,
  ChatBubbleLeftRightIcon, ChartBarIcon, BellIcon,
  ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/rooms', icon: BuildingOfficeIcon, label: 'Room Booking' },
  { to: '/complaints', icon: ExclamationCircleIcon, label: 'Complaints' },
  { to: '/chatbot', icon: ChatBubbleLeftRightIcon, label: 'AI Chatbot' },
];

const adminItems = [
  { to: '/admin', icon: ChartBarIcon, label: 'Admin Panel' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const allItems = user?.role === 'admin' ? [...navItems, ...adminItems] : navItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-dark-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">IntelliCampus</h1>
            <p className="text-xs text-brand-400">AI+</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {allItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-dark-600'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-dark-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-dark-800 border-r border-dark-500 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-dark-500 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-dark-800 border-b border-dark-500 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-600"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm text-slate-400">
              Welcome back, <span className="text-white font-medium">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <button
              onClick={markAllRead}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-600 transition-all"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Role badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              user?.role === 'admin'
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
            }`}>
              {user?.role}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
