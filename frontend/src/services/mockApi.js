/**
 * Mock API — works 100% in browser with no backend needed.
 * Stores data in localStorage so it persists across refreshes.
 */
import { MOCK_USERS, MOCK_ROOMS, MOCK_BOOKINGS, MOCK_COMPLAINTS } from './mockData';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ── Storage helpers ──────────────────────────────────────────
const store = {
  get: (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// Initialise storage with mock data on first load
if (!store.get('ic_users', null)) store.set('ic_users', MOCK_USERS);
if (!store.get('ic_rooms', null)) store.set('ic_rooms', MOCK_ROOMS);
if (!store.get('ic_bookings', null)) store.set('ic_bookings', MOCK_BOOKINGS);
if (!store.get('ic_complaints', null)) store.set('ic_complaints', MOCK_COMPLAINTS);

const uid = () => Math.random().toString(36).slice(2, 10);

// ── AI helpers ───────────────────────────────────────────────
const HOURLY = {
  lab:       [0.05,0.05,0.05,0.05,0.05,0.05,0.10,0.30,0.75,0.90,0.95,0.85,0.70,0.80,0.90,0.85,0.70,0.50,0.30,0.15,0.10,0.05,0.05,0.05],
  classroom: [0.05,0.05,0.05,0.05,0.05,0.05,0.10,0.40,0.85,0.95,0.90,0.80,0.60,0.85,0.90,0.80,0.60,0.40,0.20,0.10,0.05,0.05,0.05,0.05],
  seminar:   [0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.20,0.50,0.70,0.75,0.65,0.55,0.70,0.75,0.65,0.50,0.35,0.20,0.10,0.05,0.05,0.05,0.05],
  meeting:   [0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.15,0.40,0.60,0.70,0.65,0.55,0.65,0.70,0.60,0.45,0.30,0.15,0.05,0.05,0.05,0.05,0.05],
  auditorium:[0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.10,0.20,0.30,0.40,0.35,0.30,0.40,0.45,0.40,0.35,0.25,0.15,0.10,0.05,0.05,0.05,0.05],
};

function predictRoom(room) {
  const h = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());
  const pattern = HOURLY[room.type] || HOURLY.classroom;
  let occ = pattern[h] * (isWeekend ? 0.25 : 1);
  occ = Math.min(1, Math.max(0, occ + (Math.random() * 0.1 - 0.05)));
  const avail = Math.round((1 - occ) * 100);
  const best = [...Array(12).keys()].map(i => i + 8)
    .sort((a, b) => pattern[a] - pattern[b]).slice(0, 4)
    .sort((a, b) => a - b).map(h => `${String(h).padStart(2,'0')}:00`);
  return {
    availability_probability: avail,
    occupancy_probability: Math.round(occ * 100),
    predicted_occupancy: Math.round(room.capacity * occ),
    confidence: 85,
    best_slots: best,
    recommendation: avail >= 70 ? 'High availability — great time to book!' :
                    avail >= 40 ? 'Moderate availability — book soon.' :
                    'Low availability — try a different time.',
  };
}

const CRITICAL_KW = ['fire','flood','gas leak','electric shock','injury','accident','emergency','danger','unsafe','hazard','collapse'];
const HIGH_KW     = ['not working','broken','damaged','urgent','asap','no power','internet down','exam','blocked','projector'];
const MEDIUM_KW   = ['dirty','unclean','smell','noise','slow','issue','problem','maintenance','repair','leaking'];
const CAT_KW = {
  safety:      ['fire','danger','hazard','unsafe','injury','accident','emergency','gas','electric'],
  maintenance: ['broken','repair','fix','damaged','leak','crack','door','window','ceiling'],
  equipment:   ['projector','computer','ac','air conditioning','fan','light','wifi','internet','printer'],
  cleanliness: ['dirty','clean','smell','odor','garbage','trash','stain','washroom','toilet'],
  noise:       ['noise','loud','disturbance','sound','music','shouting'],
};

function classifyComplaint(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let priority = 'medium', confidence = 0.60;
  if (CRITICAL_KW.some(k => text.includes(k))) { priority = 'critical'; confidence = 0.93; }
  else if (HIGH_KW.some(k => text.includes(k))) { priority = 'high'; confidence = 0.82; }
  else if (MEDIUM_KW.some(k => text.includes(k))) { priority = 'medium'; confidence = 0.70; }
  else { priority = 'low'; confidence = 0.60; }

  let category = 'other';
  for (const [cat, kws] of Object.entries(CAT_KW)) {
    if (kws.some(k => text.includes(k))) { category = cat; break; }
  }
  return { priority, category, confidence };
}

// ── Chatbot ──────────────────────────────────────────────────
function chatbotReply(message, rooms) {
  const msg = message.toLowerCase();
  const available = rooms.filter(r => r.is_available_now);
  const occupied  = rooms.filter(r => !r.is_available_now);

  if (/hello|hi|hey|good/.test(msg)) {
    return { reply: `Hello! 👋 I'm your IntelliCampus AI assistant. I can help you find rooms, guide bookings, and answer campus queries. What do you need?`, suggestions: ['Show free rooms','How to book?','Campus stats'] };
  }
  if (/free|available|empty/.test(msg)) {
    const list = available.slice(0,4).map(r => `• **${r.name}** (${r.building}, Cap: ${r.capacity})`).join('\n');
    return { reply: `🟢 **${available.length} rooms available right now:**\n\n${list}\n\nClick **Book Now** on any room to reserve it!`, suggestions: ['Book a room','Show labs','Show classrooms'] };
  }
  if (/lab/.test(msg)) {
    const labs = available.filter(r => r.type === 'lab');
    const list = labs.map(r => `• **${r.name}** (Cap: ${r.capacity})`).join('\n') || 'No labs free right now.';
    return { reply: `🔬 **Available Labs:**\n\n${list}`, suggestions: ['Book a lab','Show classrooms','Campus stats'] };
  }
  if (/book|reserve|schedule/.test(msg)) {
    return { reply: `📅 **How to book a room:**\n\n1. Go to **Room Booking** in the sidebar\n2. Browse or filter rooms\n3. Click **Book Now**\n4. Fill in date, time & details\n5. Confirm ✅\n\nYou'll get a real-time notification once confirmed!`, suggestions: ['Show free rooms','My bookings','Cancel booking'] };
  }
  if (/complaint|report|issue|broken/.test(msg)) {
    return { reply: `📋 **How to report an issue:**\n\n1. Go to **Complaints** in the sidebar\n2. Click **New Complaint**\n3. Describe the issue\n4. Our AI auto-classifies priority 🤖\n5. Track status in real-time\n\nCritical issues are escalated to admin immediately!`, suggestions: ['Track complaints','Report urgent issue','View status'] };
  }
  if (/stat|how many|total|count/.test(msg)) {
    return { reply: `📊 **Live Campus Stats:**\n\n• Total rooms: **${rooms.length}**\n• Available now: **${available.length}** 🟢\n• Occupied now: **${occupied.length}** 🔴\n• Availability: **${Math.round(available.length/rooms.length*100)}%**\n\nCheck the Admin Dashboard for full analytics!`, suggestions: ['Show heatmap','View analytics','Top rooms'] };
  }
  if (/peak|busy|best time/.test(msg)) {
    return { reply: `⏰ **Peak Hours on Campus:**\n\n• 🔴 Busiest: **9–11 AM** and **2–4 PM**\n• 🟡 Moderate: **11 AM–12 PM** and **4–6 PM**\n• 🟢 Quietest: **Before 8 AM**, **after 6 PM**, and **weekends**\n\nBook during off-peak hours for guaranteed availability!`, suggestions: ['Book a room','Show free rooms','Campus stats'] };
  }
  return { reply: `I'm not sure about that. I can help with:\n\n🏠 **Room availability** — find free rooms\n📅 **Bookings** — how to book/cancel\n📋 **Complaints** — report & track issues\n📊 **Stats** — live campus data\n\nTry: "Which rooms are free?" or "How do I book a lab?"`, suggestions: ['Show free rooms','How to book?','Report issue'] };
}

// ── Mock API object ──────────────────────────────────────────
const mockApi = {
  // AUTH
  auth: {
    login: async (email, password) => {
      await delay();
      const users = store.get('ic_users', MOCK_USERS);
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Invalid email or password');
      const { password: _, ...safeUser } = user;
      const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 7*86400000 }));
      return { token, user: safeUser };
    },
    register: async (data) => {
      await delay();
      const users = store.get('ic_users', MOCK_USERS);
      if (users.find(u => u.email === data.email)) throw new Error('Email already registered');
      const newUser = { id: uid(), ...data };
      store.set('ic_users', [...users, newUser]);
      const { password: _, ...safeUser } = newUser;
      const token = btoa(JSON.stringify({ id: newUser.id, role: newUser.role, exp: Date.now() + 7*86400000 }));
      return { token, user: safeUser };
    },
    me: async (token) => {
      await delay(100);
      const payload = JSON.parse(atob(token));
      if (payload.exp < Date.now()) throw new Error('Token expired');
      const users = store.get('ic_users', MOCK_USERS);
      const user = users.find(u => u.id === payload.id);
      if (!user) throw new Error('User not found');
      const { password: _, ...safeUser } = user;
      return { user: safeUser };
    },
  },

  // ROOMS
  rooms: {
    list: async (filters = {}) => {
      await delay();
      let rooms = store.get('ic_rooms', MOCK_ROOMS);
      if (filters.type && filters.type !== 'all') rooms = rooms.filter(r => r.type === filters.type);
      if (filters.search) rooms = rooms.filter(r =>
        r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.building.toLowerCase().includes(filters.search.toLowerCase())
      );
      return { rooms };
    },
    predict: async (roomId) => {
      await delay(600);
      const rooms = store.get('ic_rooms', MOCK_ROOMS);
      const room = rooms.find(r => r.id === roomId);
      if (!room) throw new Error('Room not found');
      return { prediction: predictRoom(room), room };
    },
  },

  // BOOKINGS
  bookings: {
    list: async (userId, isAdmin) => {
      await delay();
      const bookings = store.get('ic_bookings', MOCK_BOOKINGS);
      return { bookings: isAdmin ? bookings : bookings.filter(b => b.user_id === userId) };
    },
    create: async (data, user) => {
      await delay(500);
      const bookings = store.get('ic_bookings', MOCK_BOOKINGS);
      const rooms = store.get('ic_rooms', MOCK_ROOMS);
      const room = rooms.find(r => r.id === data.room_id);
      // Check conflict
      const conflict = bookings.find(b =>
        b.room_id === data.room_id && b.status === 'confirmed' &&
        new Date(b.start_time) < new Date(data.end_time) &&
        new Date(b.end_time) > new Date(data.start_time)
      );
      if (conflict) throw new Error('Room already booked for this time slot');
      const newBooking = {
        id: uid(), ...data, user_id: user.id,
        room_name: room?.name || 'Unknown', building: room?.building || '',
        room_type: room?.type || '', booked_by_name: user.name,
        status: 'confirmed', created_at: new Date().toISOString(),
      };
      store.set('ic_bookings', [...bookings, newBooking]);
      // Mark room as occupied
      store.set('ic_rooms', rooms.map(r => r.id === data.room_id ? { ...r, is_available_now: false } : r));
      return { booking: newBooking };
    },
    cancel: async (bookingId, userId, isAdmin) => {
      await delay();
      const bookings = store.get('ic_bookings', MOCK_BOOKINGS);
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');
      if (booking.user_id !== userId && !isAdmin) throw new Error('Not authorized');
      store.set('ic_bookings', bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      return { success: true };
    },
  },

  // COMPLAINTS
  complaints: {
    list: async (userId, isAdmin) => {
      await delay();
      const complaints = store.get('ic_complaints', MOCK_COMPLAINTS);
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = [...complaints].sort((a, b) => (order[a.ai_priority] ?? 4) - (order[b.ai_priority] ?? 4));
      return { complaints: isAdmin ? sorted : sorted.filter(c => c.user_id === userId) };
    },
    create: async (data, user) => {
      await delay(700);
      const complaints = store.get('ic_complaints', MOCK_COMPLAINTS);
      const ai = classifyComplaint(data.title, data.description);
      const newComplaint = {
        id: uid(), ...data, user_id: user.id,
        submitted_by: user.name, room_name: null,
        ai_priority: ai.priority, ai_confidence: ai.confidence,
        category: ai.category, status: 'open',
        created_at: new Date().toISOString(),
      };
      store.set('ic_complaints', [...complaints, newComplaint]);
      return { complaint: newComplaint, ai_analysis: ai };
    },
    update: async (id, updates) => {
      await delay();
      const complaints = store.get('ic_complaints', MOCK_COMPLAINTS);
      store.set('ic_complaints', complaints.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
      return { success: true };
    },
  },

  // AI
  ai: {
    chat: async (message, rooms) => {
      await delay(500);
      return chatbotReply(message, rooms);
    },
    insights: async () => {
      await delay();
      const bookings = store.get('ic_bookings', MOCK_BOOKINGS);
      const complaints = store.get('ic_complaints', MOCK_COMPLAINTS);
      const rooms = store.get('ic_rooms', MOCK_ROOMS);
      return {
        insights: {
          bookings: {
            total: bookings.length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
            this_week: bookings.length,
          },
          complaints: {
            total: complaints.length,
            open: complaints.filter(c => c.status === 'open').length,
            critical: complaints.filter(c => c.ai_priority === 'critical').length,
            high: complaints.filter(c => c.ai_priority === 'high').length,
          },
          top_rooms: rooms.slice(0, 5).map(r => ({ name: r.name, type: r.type, booking_count: Math.floor(Math.random() * 40 + 5) })),
        },
      };
    },
  },
};

export default mockApi;
