import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon, ExclamationCircleIcon, CalendarIcon,
  SparklesIcon, ArrowTrendingUpIcon, ClockIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import mockApi from '../services/mockApi';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="glass-card p-5 sm:p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs sm:text-sm text-slate-400">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mockApi.ai.insights(),
      mockApi.rooms.list(),
      mockApi.bookings.list(user?.id, user?.role === 'admin'),
    ]).then(([ins, rm, bk]) => {
      setInsights(ins.insights);
      setRooms(rm.rooms);
      setBookings(bk.bookings);
    }).finally(() => setLoading(false));
  }, [user]);

  const availableRooms = rooms.filter(r => r.is_available_now);
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');

  const bookingTrend = [
    { day: 'Mon', bookings: 12 }, { day: 'Tue', bookings: 19 },
    { day: 'Wed', bookings: 15 }, { day: 'Thu', bookings: 22 },
    { day: 'Fri', bookings: 18 }, { day: 'Sat', bookings: 8 },
    { day: 'Sun', bookings: 5 },
  ];

  const complaintData = [
    { name: 'Critical', value: insights?.complaints?.critical || 1 },
    { name: 'High',     value: insights?.complaints?.high || 2 },
    { name: 'Medium',   value: 3 },
    { name: 'Low',      value: 2 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-500" />
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">AI Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time campus intelligence</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-xl w-fit">
          <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          <span className="text-sm text-brand-400">AI Active</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={BuildingOfficeIcon} label="Available Rooms" value={availableRooms.length} sub={`of ${rooms.length} total`} color="from-brand-500 to-accent-purple" delay={0} />
        <StatCard icon={CalendarIcon} label="My Bookings" value={bookings.length} sub="all time" color="from-accent-cyan to-brand-500" delay={0.1} />
        <StatCard icon={ExclamationCircleIcon} label="Open Complaints" value={insights?.complaints?.open || 0} sub={`${insights?.complaints?.critical || 0} critical`} color="from-accent-red to-accent-yellow" delay={0.2} />
        <StatCard icon={ArrowTrendingUpIcon} label="AI Accuracy" value="85%" sub="prediction rate" color="from-accent-green to-accent-cyan" delay={0.3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-5 sm:p-6 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
            <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
            Booking Trend (This Week)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={bookingTrend}>
              <defs>
                <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="bookings" stroke="#6366f1" fill="url(#bg1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-5 sm:p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
            <ExclamationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-accent-red" />
            Complaints by Priority
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={complaintData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {complaintData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {complaintData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-slate-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Available rooms */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
              <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-accent-green" />
              Available Now
            </h3>
            <Link to="/rooms" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {availableRooms.slice(0, 4).map(room => (
              <div key={room.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{room.name}</p>
                  <p className="text-xs text-slate-400">{room.building} · Cap: {room.capacity}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                  <span className="text-xs text-accent-green">Free</span>
                </div>
              </div>
            ))}
            {availableRooms.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No rooms available right now</p>}
          </div>
        </motion.div>

        {/* Upcoming bookings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
              <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
              My Bookings
            </h3>
            <Link to="/rooms" className="text-xs text-brand-400 hover:text-brand-300">Book room →</Link>
          </div>
          <div className="space-y-2.5">
            {upcomingBookings.slice(0, 4).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{b.title}</p>
                  <p className="text-xs text-slate-400">{b.room_name} · {new Date(b.start_time).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {upcomingBookings.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400 mb-3">No bookings yet</p>
                <Link to="/rooms" className="text-sm text-brand-400 hover:text-brand-300">Book a room →</Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* AI Insight */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="glass-card p-5 sm:p-6 border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-accent-cyan/5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">AI Insight of the Day</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Peak booking hours are <span className="text-brand-400 font-medium">9–11 AM</span> and <span className="text-brand-400 font-medium">2–4 PM</span>.
              CS Lab 101 has <span className="text-accent-green font-medium">72% availability</span> this afternoon.
              Consider booking early to secure your preferred slot.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
