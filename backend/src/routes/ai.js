const express = require('express');
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// ── POST /api/ai/chat ────────────────────────────────────────
router.post('/chat', authenticate, async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message required' });
  }

  try {
    // Enrich context with live DB data
    const roomsResult = await db.query(`
      SELECT r.name, r.type, r.building, r.capacity,
        CASE WHEN EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_id = r.id AND b.status = 'confirmed'
            AND NOW() BETWEEN b.start_time AND b.end_time
        ) THEN 'occupied' ELSE 'available' END AS current_status
      FROM rooms r WHERE r.is_active = TRUE
    `);

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/chatbot`, {
      message,
      history: history || [],
      context: {
        rooms: roomsResult.rows,
        user_name: req.user.name,
        user_role: req.user.role,
        current_time: new Date().toISOString(),
      },
    });

    res.json({ success: true, reply: aiResponse.data.reply, suggestions: aiResponse.data.suggestions });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    // Fallback response
    res.json({
      success: true,
      reply: "I'm having trouble connecting to my AI brain right now. Please try again in a moment, or check the room availability page directly.",
      suggestions: ['Show available rooms', 'Book a room', 'Check my bookings'],
      fallback: true,
    });
  }
});

// ── POST /api/ai/recommend-rooms ─────────────────────────────
router.post('/recommend-rooms', authenticate, async (req, res) => {
  const { purpose, attendees, preferred_time, duration_hours } = req.body;

  try {
    const rooms = await db.query('SELECT * FROM rooms WHERE is_active = TRUE AND capacity >= $1', [attendees || 1]);

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/recommend-rooms`, {
      purpose,
      attendees,
      preferred_time,
      duration_hours,
      available_rooms: rooms.rows,
    });

    res.json({ success: true, recommendations: aiResponse.data.recommendations });
  } catch (err) {
    // Fallback: simple capacity-based recommendation
    const rooms = await db.query(
      'SELECT * FROM rooms WHERE is_active = TRUE AND capacity >= $1 ORDER BY capacity LIMIT 3',
      [attendees || 1]
    );
    res.json({
      success: true,
      recommendations: rooms.rows.map(r => ({
        ...r,
        score: 0.75,
        reason: 'Matches your capacity requirement',
      })),
      fallback: true,
    });
  }
});

// ── GET /api/ai/insights ─────────────────────────────────────
router.get('/insights', authenticate, async (req, res) => {
  try {
    const [bookingStats, complaintStats, roomUsage] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week
        FROM bookings
      `),
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'open') as open,
          COUNT(*) FILTER (WHERE ai_priority = 'critical') as critical,
          COUNT(*) FILTER (WHERE ai_priority = 'high') as high
        FROM complaints
      `),
      db.query(`
        SELECT r.name, r.type, COUNT(b.id) as booking_count
        FROM rooms r
        LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'confirmed'
        GROUP BY r.id, r.name, r.type
        ORDER BY booking_count DESC
        LIMIT 5
      `),
    ]);

    res.json({
      success: true,
      insights: {
        bookings: bookingStats.rows[0],
        complaints: complaintStats.rows[0],
        top_rooms: roomUsage.rows,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate insights' });
  }
});

module.exports = router;
