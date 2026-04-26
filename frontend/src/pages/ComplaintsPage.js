import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ExclamationCircleIcon, PlusIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import mockApi from '../services/mockApi';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', class: 'priority-critical', dot: 'bg-red-500' },
  high:     { label: 'High',     class: 'priority-high',     dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   class: 'priority-medium',   dot: 'bg-yellow-500' },
  low:      { label: 'Low',      class: 'priority-low',      dot: 'bg-green-500' },
};
const STATUS_CONFIG = {
  open:        { label: 'Open',        class: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  in_progress: { label: 'In Progress', class: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  resolved:    { label: 'Resolved',    class: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  closed:      { label: 'Closed',      class: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
};

const ComplaintCard = ({ complaint, onUpdate, isAdmin }) => {
  const p = PRIORITY_CONFIG[complaint.ai_priority] || PRIORITY_CONFIG.medium;
  const s = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.open;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 sm:p-5 hover:border-brand-500/20 transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm sm:text-base truncate">{complaint.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {complaint.submitted_by} · {new Date(complaint.created_at).toLocaleDateString()}
            {complaint.room_name && ` · ${complaint.room_name}`}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${p.class}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${p.dot} mr-1`} />
          {p.label}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-slate-400 mb-3 line-clamp-2">{complaint.description}</p>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 rounded-lg text-xs ${s.class}`}>{s.label}</span>
          {complaint.category && (
            <span className="px-2 py-1 bg-dark-600 text-slate-400 text-xs rounded-lg capitalize">{complaint.category}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <SparklesIcon className="w-3 h-3 text-brand-400" />
          <span>{Math.round((complaint.ai_confidence || 0.5) * 100)}% AI confidence</span>
        </div>
      </div>
      {isAdmin && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-dark-500">
          <button onClick={() => onUpdate(complaint.id, 'in_progress')}
            className="flex-1 py-1.5 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-all">
            In Progress
          </button>
          <button onClick={() => onUpdate(complaint.id, 'resolved')}
            className="flex-1 py-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all">
            Resolve
          </button>
        </div>
      )}
    </motion.div>
  );
};

const NewComplaintModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  const CRITICAL_KW = ['fire','flood','gas','electric shock','injury','accident','emergency','danger','unsafe','hazard'];
  const HIGH_KW = ['not working','broken','damaged','urgent','asap','no power','internet down','exam','blocked'];
  const MEDIUM_KW = ['dirty','unclean','smell','noise','slow','issue','problem','maintenance','repair'];

  const handleDescChange = (val) => {
    setForm(f => ({ ...f, description: val }));
    if (val.length > 15) {
      const text = val.toLowerCase();
      if (CRITICAL_KW.some(k => text.includes(k))) setAiPreview('critical');
      else if (HIGH_KW.some(k => text.includes(k))) setAiPreview('high');
      else if (MEDIUM_KW.some(k => text.includes(k))) setAiPreview('medium');
      else setAiPreview('low');
    } else setAiPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await mockApi.complaints.create(form, user);
      const p = res.ai_analysis.priority;
      addNotification({
        title: `📋 Complaint Submitted`,
        message: `AI classified as ${p.toUpperCase()} priority`,
        type: p === 'critical' || p === 'high' ? 'warning' : 'info',
      });
      toast.success(`Submitted! AI classified as ${p.toUpperCase()} priority 🤖`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="glass-card p-5 sm:p-6 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white text-base sm:text-lg">New Complaint</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-600 rounded-lg text-slate-400"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full px-3 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              placeholder="Brief description of the issue" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => handleDescChange(e.target.value)} required rows={4}
              className="w-full px-3 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
              placeholder="Describe the issue in detail..." />
          </div>

          <AnimatePresence>
            {aiPreview && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl border border-brand-500/20">
                <SparklesIcon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-1">AI Priority Preview</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${PRIORITY_CONFIG[aiPreview]?.class}`}>
                    {PRIORITY_CONFIG[aiPreview]?.label}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? 'Analyzing & Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchComplaints = () => {
    setLoading(true);
    mockApi.complaints.list(user?.id, user?.role === 'admin')
      .then(res => setComplaints(res.complaints))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, [user]);

  const handleUpdate = async (id, status) => {
    try {
      await mockApi.complaints.update(id, { status });
      toast.success(`Marked as ${status}`);
      fetchComplaints();
    } catch { toast.error('Update failed'); }
  };

  const filtered = filter === 'all' ? complaints :
    filter === 'open' ? complaints.filter(c => c.status === 'open') :
    complaints.filter(c => c.ai_priority === filter);

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    critical: complaints.filter(c => c.ai_priority === 'critical').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Complaints</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-powered priority classification</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all w-fit">
          <PlusIcon className="w-4 h-4" />
          New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Open', value: stats.open, color: 'text-blue-400' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-3 sm:p-4 text-center">
            <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'critical', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400 hover:text-white border border-dark-500'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => (
            <ComplaintCard key={c.id} complaint={c} onUpdate={handleUpdate} isAdmin={user?.role === 'admin'} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No complaints found</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && <NewComplaintModal onClose={() => setShowModal(false)} onSuccess={fetchComplaints} />}
      </AnimatePresence>
    </div>
  );
}
