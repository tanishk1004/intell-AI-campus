// ── Mock Users ───────────────────────────────────────────────
export const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@intellicampus.ai',
    password: 'Admin@123',
    role: 'admin',
    department: 'Administration',
  },
  {
    id: '2',
    name: 'John Student',
    email: 'student@intellicampus.ai',
    password: 'Student@123',
    role: 'student',
    department: 'Computer Science',
  },
];

// ── Mock Rooms ───────────────────────────────────────────────
export const MOCK_ROOMS = [
  { id: 'r1', name: 'CS Lab 101', building: 'Tech Block A', floor: 1, capacity: 40, type: 'lab', amenities: ['computers', 'projector', 'ac', 'whiteboard'], is_available_now: true },
  { id: 'r2', name: 'CS Lab 102', building: 'Tech Block A', floor: 1, capacity: 40, type: 'lab', amenities: ['computers', 'projector', 'ac'], is_available_now: false },
  { id: 'r3', name: 'Seminar Hall A', building: 'Main Block', floor: 2, capacity: 80, type: 'seminar', amenities: ['projector', 'ac', 'mic', 'whiteboard'], is_available_now: true },
  { id: 'r4', name: 'Classroom 201', building: 'Main Block', floor: 2, capacity: 60, type: 'classroom', amenities: ['projector', 'ac', 'whiteboard'], is_available_now: true },
  { id: 'r5', name: 'Classroom 202', building: 'Main Block', floor: 2, capacity: 60, type: 'classroom', amenities: ['projector', 'whiteboard'], is_available_now: false },
  { id: 'r6', name: 'Electronics Lab', building: 'Tech Block B', floor: 1, capacity: 30, type: 'lab', amenities: ['equipment', 'ac', 'whiteboard'], is_available_now: true },
  { id: 'r7', name: 'Meeting Room 1', building: 'Admin Block', floor: 1, capacity: 15, type: 'meeting', amenities: ['tv', 'ac', 'whiteboard'], is_available_now: true },
  { id: 'r8', name: 'Auditorium', building: 'Main Block', floor: 0, capacity: 500, type: 'auditorium', amenities: ['stage', 'mic', 'projector', 'ac'], is_available_now: false },
  { id: 'r9', name: 'Research Lab', building: 'Tech Block A', floor: 2, capacity: 20, type: 'lab', amenities: ['computers', 'servers', 'ac'], is_available_now: true },
  { id: 'r10', name: 'Classroom 301', building: 'Main Block', floor: 3, capacity: 60, type: 'classroom', amenities: ['projector', 'ac', 'whiteboard'], is_available_now: true },
];

// ── Mock Bookings ────────────────────────────────────────────
export const MOCK_BOOKINGS = [
  {
    id: 'b1', room_id: 'r2', user_id: '2', title: 'AI Project Meeting',
    room_name: 'CS Lab 102', building: 'Tech Block A', room_type: 'lab',
    booked_by_name: 'John Student',
    start_time: new Date(Date.now() + 3600000).toISOString(),
    end_time: new Date(Date.now() + 7200000).toISOString(),
    status: 'confirmed', attendees_count: 5,
  },
  {
    id: 'b2', room_id: 'r8', user_id: '2', title: 'Annual Tech Fest',
    room_name: 'Auditorium', building: 'Main Block', room_type: 'auditorium',
    booked_by_name: 'John Student',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 93600000).toISOString(),
    status: 'confirmed', attendees_count: 200,
  },
];

// ── Mock Complaints ──────────────────────────────────────────
export const MOCK_COMPLAINTS = [
  {
    id: 'c1', user_id: '2', title: 'Projector not working in CS Lab 101',
    description: 'The projector has been broken for 2 days. Urgent repair needed.',
    category: 'equipment', ai_priority: 'high', ai_confidence: 0.87,
    status: 'open', submitted_by: 'John Student', room_name: 'CS Lab 101',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'c2', user_id: '2', title: 'Fire alarm false trigger',
    description: 'Fire alarm triggered without any fire. Dangerous and disruptive.',
    category: 'safety', ai_priority: 'critical', ai_confidence: 0.95,
    status: 'in_progress', submitted_by: 'John Student', room_name: 'Seminar Hall A',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'c3', user_id: '1', title: 'Classroom 201 needs cleaning',
    description: 'The classroom is dirty and smells bad.',
    category: 'cleanliness', ai_priority: 'medium', ai_confidence: 0.72,
    status: 'open', submitted_by: 'Admin User', room_name: 'Classroom 201',
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'c4', user_id: '2', title: 'AC not cooling in Research Lab',
    description: 'Air conditioning is not working properly.',
    category: 'equipment', ai_priority: 'high', ai_confidence: 0.81,
    status: 'resolved', submitted_by: 'John Student', room_name: 'Research Lab',
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'c5', user_id: '2', title: 'Noise disturbance near library',
    description: 'Students are making noise near the library area.',
    category: 'noise', ai_priority: 'low', ai_confidence: 0.65,
    status: 'open', submitted_by: 'John Student', room_name: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];
