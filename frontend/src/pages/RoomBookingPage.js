import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon, SparklesIcon, MagnifyingGlassIcon,
  XMarkIcon, UsersIcon,
} from '@heroicons/react/24/outline';
import mockApi from '../services/mockApi';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ROOM_TYPES = ['all', 'lab', 'classroom', 'seminar', 'meeting', 'auditorium'];

const PredictionBar = ({ probability }) => {
  const pct = probability;
  const color = pct >= 70 ? 'bg-accent-green' : pct >= 40 ? 'bg-accent-yellow' : 'bg-accent-red';
  const textColor = pct >= 70 ? 'text-accent-green' : pct >= 40 ? 'text-accent-yellow' : 'text-accent-red';
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>AI Availability</span>
        <span className={textColor}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
};

const RoomCard = ({ room, onBook }) => {
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  const handlePredict = async () => {
    setPredLoading(true);
    try {
      const res = await mockApi.rooms.predict(room.id);
      setPrediction(res.prediction);
    } catch { toast.error('Prediction failed'); }
    finally { setPredLoading(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 sm:p-5 hover:border-brand-500/30 transition-all duration-300 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-white text-sm sm:text-base truncate">{room.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{room.building} · Floor {room.floor}</p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${room.is_available_now ? 'status-available' : 'status-occupied'}`}>
          {room.is_available_now ? '🟢 Free' : '🔴 Busy'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
        <span className="flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" />{room.capacity}</span>
        <span className="capitalize px-2 py-0.5 bg-dark-600 rounded-md">{room.type}</span>
      </div>

      {room.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {room.amenities.slice(0, 3).map(a => (
            <span key={a} className="px-2 py-0.5 bg-dark-600 text-slate-400 text-xs rounded-md">{a}</span>
          ))}
          {room.amenities.length > 3 && (
            <span className="px-2 py-0.5 bg-dark-600 text-slate-400 text-xs rounded-md">+{room.amenities.length - 3}</span>
          )}
        </div>
      )}

      {prediction && <PredictionBar probability={prediction.availability_probability} />}

      {prediction && (
        <div className="mt-2 p-2.5 bg-dark-700 rounded-xl">
          <p className="text-xs text-slate-400">{prediction.recommendation}</p>
          {prediction.best_slots?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {prediction.best_slots.map(s => (
                <span key={s} className="px-2 py-0.5 bg-brand-500/20 text-brand-400 text-xs rounded-md">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-4">
        <button onClick={handlePredict} disabled={predLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-dark-600 hover:bg-dark-500 text-slate-300 text-xs rounded-xl transition-all disabled:opacity-50">
          <SparklesIcon className="w-3.5 h-3.5" />
          {predLoading ? 'Predicting...' : 'AI Predict'}
        </button>
        <button onClick={() => onBook(room)}
          className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-xl transition-all">
          Book Now
        </button>
      </div>
    </motion.div>
  );
};

const BookingModal = ({ room, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '', attendees_count: 1 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.start_time) >= new Date(form.end_time)) {
      toast.error('End time must be after start time'); return;
    }
    setLoading(true);
    try {
      await mockApi.bookings.create({ ...form, room_id: room.id }, user);
      addNotification({ title: '✅ Booking Confirmed', message: `"${form.title}" booked in ${room.name}`, type: 'success' });
      toast.success('Room booked successfully! 🎉');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="glass-card p-5 sm:p-6 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-white text-base sm:text-lg">Book {room.name}</h2>
            <p className="text-xs text-slate-400">{room.building} · Capacity: {room.capacity}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-600 rounded-lg text-slate-400"><XMarkIcon className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Booking Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="w-full px-3 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              placeholder="e.g. CS Project Meeting" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Start Time *</label>
              <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required
                className="w-full px-3 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">End Time *</label>
              <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required
                className="w-full px-3 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Attendees (max {room.capacity})</label>
            <input type="number" min={1} max={room.capacity} value={form.attendees_count}
              onChange={e => setForm({ ...form, attendees_count: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
              placeholder="Optional details..." />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default function RoomBookingPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [bookingRoom, setBookingRoom] = useState(null);

  const fetchRooms = () => {
    setLoading(true);
    mockApi.rooms.list().then(res => setRooms(res.rooms)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, []);

  const filtered = rooms.filter(r => {
    const matchType = filter === 'all' || r.type === filter;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Room Booking</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-powered availability predictions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-2 h-2 bg-accent-green rounded-full" />
          {rooms.filter(r => r.is_available_now).length} available now
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms or buildings..."
            className="w-full pl-9 pr-4 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROOM_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filter === t ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400 hover:text-white border border-dark-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500" />
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(room => <RoomCard key={room.id} room={room} onBook={setBookingRoom} />)}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No rooms match your filters</p>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {bookingRoom && <BookingModal room={bookingRoom} onClose={() => setBookingRoom(null)} onSuccess={fetchRooms} />}
      </AnimatePresence>
    </div>
  );
}
