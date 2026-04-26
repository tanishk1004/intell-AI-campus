import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon, BuildingOfficeIcon, CalendarIcon,
  ExclamationCircleIcon, ArrowDownTrayIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import mockApi from '../services/mockApi';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

const generateHeatmap = () =>
  DAYS.map(day => ({
    day,
    hours: HOURS.map(h => ({
      hour: h,
      value: Math.random() * (day === 'Sat' || day === 'Sun' ? 0.3 : 1),
    })),
  }));

export default function AdminPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heatmap] = useState(generateHeatmap());

  useEffect(() => {
    mockApi.ai.insights().then(res => setInsights(res.insights)).finally(() => setLoading(false));
  }, []);

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(insights, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intellicampus-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-500" />
    </div>
  );

  const bookingTrend = DAYS.map((d, i) => ({ day: d, count: [12, 19, 15, 22, 18, 8, 5][i] }));
  const pieData = [
    { name: 'Critical', value: insights?.complaints?.critical || 1 },
    { name: 'High',     value: insights?.complaints?.high || 2 },
    { name: 'Medium',   value: 3 },
    { name: 'Low',      value: 2 },
  ];
  const roomData = insights?.top_rooms || [];

  const overviewCards = [
    { label: 'Total Users',      value: 4,  icon: UsersIcon,             color: 'from-brand-500 to-accent-purple' },
    { label: 'Total Rooms',      value: 10, icon: BuildingOfficeIcon,     color: 'from-accent-cyan to-brand-500' },
    { label: 'Active Bookings',  value: insights?.bookings?.confirmed || 2, icon: CalendarIcon, color: 'from-accent-green to-accent-cyan' },
    { label: 'Open Complaints',  value: insights?.complaints?.open || 3, icon: ExclamationCircleIcon, color: 'from-accent-red to-accent-yellow' },
    { label: 'Bookings Today',   value: 5,  icon: CalendarIcon,           color: 'from-accent-yellow to-accent-green' },
    { label: 'Complaints Today', value: 2,  icon: ExclamationCircleIcon,  color: 'from-accent-purple to-brand-500' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Campus analytics & AI insights</p>
        </div>
        <button onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-500 text-slate-300 text-sm rounded-xl hover:border-brand-500/30 hover:text-white transition-all w-fit">
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {overviewCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-3 sm:p-4">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 sm:mb-3`}>
              <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5 sm:p-6 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4 text-sm sm:text-base">Bookings This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={bookingTrend}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#ag1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-5 sm:p-6">
          <h3 className="font-semibold text-white mb-4 text-sm sm:text-base">Complaint Priorities</h3>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-slate-400 capitalize">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Room utilization */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card p-5 sm:p-6">
        <h3 className="font-semibold text-white mb-4 text-sm sm:text-base">Room Utilization</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={roomData.length > 0 ? roomData.map(r => ({ name: r.name, bookings: r.booking_count })) : [
            { name: 'CS Lab 101', bookings: 45 }, { name: 'Seminar Hall A', bookings: 38 },
            { name: 'Classroom 201', bookings: 32 }, { name: 'CS Lab 102', bookings: 28 },
            { name: 'Electronics Lab', bookings: 22 },
          ]}>
            <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }} />
            <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="glass-card p-5 sm:p-6">
        <h3 className="font-semibold text-white mb-4 text-sm sm:text-base">
          Campus Usage Heatmap <span className="text-xs text-slate-400 font-normal">(by day & hour)</span>
        </h3>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 480 }}>
            <div className="flex gap-1 mb-2 ml-10">
              {HOURS.map(h => <div key={h} className="flex-1 text-center text-xs text-slate-500">{h}</div>)}
            </div>
            <div className="space-y-1">
              {heatmap.map(({ day, hours }) => (
                <div key={day} className="flex items-center gap-1">
                  <div className="w-8 text-xs text-slate-400 text-right pr-1 flex-shrink-0">{day}</div>
                  {hours.map(({ hour, value }) => (
                    <div key={hour} className="flex-1 h-7 rounded-sm transition-all hover:scale-110 cursor-pointer"
                      style={{ background: `rgba(99,102,241,${Math.max(0.05, value)})` }}
                      title={`${day} ${hour}:00 — ${Math.round(value * 100)}% utilization`} />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-xs text-slate-400">Low</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                <div key={v} className="w-5 h-3 rounded-sm" style={{ background: `rgba(99,102,241,${v})` }} />
              ))}
              <span className="text-xs text-slate-400">High</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="glass-card p-5 sm:p-6 border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-accent-cyan/5">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
          <h3 className="font-semibold text-white text-sm sm:text-base">AI-Generated Insights</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { title: '⏰ Peak Hours', insight: 'Highest demand at 9–11 AM and 2–4 PM. Consider adding more rooms during these windows.', color: 'text-accent-yellow' },
            { title: '📉 Underutilized', insight: 'Meeting Room 1 has only 22% utilization. Promote it for small group sessions.', color: 'text-accent-cyan' },
            { title: '🚨 Complaint Trend', insight: 'Critical complaints this week are equipment-related. Schedule preventive maintenance.', color: 'text-accent-red' },
          ].map((ins, i) => (
            <div key={i} className="p-3 sm:p-4 bg-dark-700 rounded-xl">
              <h4 className={`text-xs sm:text-sm font-semibold mb-1.5 ${ins.color}`}>{ins.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{ins.insight}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
