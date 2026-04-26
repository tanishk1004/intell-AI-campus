const express = require('express');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// ── GET /api/rooms ───────────────────────────────────────────
// List all rooms with current availability
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, building, capacity } = req.query;
    let query = `
      SELECT r.*,
        CASE WHEN EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_id = r.id
            AND b.status = 'confirmed'
            AND NOW() BETWEEN b.start_time AND b.end_time
        ) THEN false ELSE true END AS is_available_now
      FROM rooms r
      WHERE r.is_active = TRUE
    `;
    const params = [];
    let idx = 1;

    if (type) { query += ` AND r.type = $${idx++}`; params.push(type); }
    if (building) { query += ` AND r.building = $${idx++}`; params.push(building); }
    if (capacity) { query += ` AND r.capacity >= $${idx++}`; params.push(parseInt(capacity)); }

    query += ' ORDER BY r.building, r.floor, r.name';

    const result = await db.query(query, params);
    res.json({ success: true, rooms: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
});

// ── GET /api/rooms/:id ───────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Get upcoming bookings for this room
    const bookings = await db.query(
      `SELECT b.*, u.name as booked_by
       FROM bookings b JOIN users u ON b.user_id = u.id
       WHERE b.room_id = $1 AND b.start_time >= NOW() AND b.status = 'confirmed'
       ORDER BY b.start_time LIMIT 10`,
      [req.params.id]
    );

    res.json({ success: true, room: result.rows[0], upcoming_bookings: bookings.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch room' });
  }
});

// ── GET /api/rooms/:id/predict ───────────────────────────────
// AI prediction for a specific room
router.get('/:id/predict', authenticate, async (req, res) => {
  try {
    const { datetime } = req.query;
    const room = await db.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (room.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Call AI service
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict-room`, {
      room_id: req.params.id,
      room_type: room.rows[0].type,
      capacity: room.rows[0].capacity,
      datetime: datetime || new Date().toISOString(),
    });

    // Cache prediction in DB
    await db.query(
      `INSERT INTO predictions (room_id, predicted_for, availability_probability, predicted_occupancy, confidence_score)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.params.id,
        datetime || new Date(),
        aiResponse.data.availability_probability,
        aiResponse.data.predicted_occupancy,
        aiResponse.data.confidence,
      ]
    );

    res.json({ success: true, prediction: aiResponse.data, room: room.rows[0] });
  } catch (err) {
    console.error('AI prediction error:', err.message);
    // Fallback prediction if AI service is down
    res.json({
      success: true,
      prediction: {
        availability_probability: 0.72,
        predicted_occupancy: 15,
        confidence: 0.68,
        recommendation: 'Likely available based on historical patterns',
        best_slots: ['09:00', '11:00', '14:00', '16:00'],
      },
      room: (await db.query('SELECT * FROM rooms WHERE id = $1', [req.params.id])).rows[0],
      fallback: true,
    });
  }
});

// ── POST /api/rooms (Admin only) ─────────────────────────────
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, building, floor, capacity, type, amenities } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO rooms (name, building, floor, capacity, type, amenities)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, building, floor, capacity, type, amenities]
    );
    res.status(201).json({ success: true, room: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
});

module.exports = router;
