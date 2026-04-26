const express = require('express');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: send real-time notification
const sendNotification = async (io, userId, notification) => {
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, notification.title, notification.message, notification.type || 'booking']
    );
    io.to(`user-${userId}`).emit('notification', result.rows[0]);
  } catch (err) {
    console.error('Notification error:', err);
  }
};

// ── GET /api/bookings ────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = `
      SELECT b.*, r.name as room_name, r.building, r.type as room_type,
             u.name as booked_by_name, u.email as booked_by_email
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN users u ON b.user_id = u.id
      ${isAdmin ? '' : 'WHERE b.user_id = $1'}
      ORDER BY b.start_time DESC
      LIMIT 50
    `;
    const params = isAdmin ? [] : [req.user.id];
    const result = await db.query(query, params);
    res.json({ success: true, bookings: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// ── POST /api/bookings ───────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { room_id, title, description, start_time, end_time, attendees_count } = req.body;

  if (!room_id || !title || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (start >= end) {
    return res.status(400).json({ success: false, message: 'End time must be after start time' });
  }

  if (start < new Date()) {
    return res.status(400).json({ success: false, message: 'Cannot book in the past' });
  }

  try {
    // Check for conflicts
    const conflict = await db.query(
      `SELECT id FROM bookings
       WHERE room_id = $1 AND status = 'confirmed'
         AND tsrange(start_time, end_time) && tsrange($2::timestamp, $3::timestamp)`,
      [room_id, start_time, end_time]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Room is already booked for this time slot' });
    }

    const result = await db.query(
      `INSERT INTO bookings (room_id, user_id, title, description, start_time, end_time, attendees_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [room_id, req.user.id, title, description, start_time, end_time, attendees_count || 1]
    );

    const booking = result.rows[0];

    // Log usage
    await db.query(
      'INSERT INTO room_usage_logs (room_id, occupancy_count) VALUES ($1, $2)',
      [room_id, attendees_count || 1]
    );

    // Send real-time notification
    const io = req.app.get('io');
    await sendNotification(io, req.user.id, {
      title: '✅ Booking Confirmed',
      message: `Your booking "${title}" has been confirmed.`,
      type: 'booking',
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error(err);
    if (err.code === 'P0001' || err.message.includes('overlap')) {
      return res.status(409).json({ success: false, message: 'Room is already booked for this time slot' });
    }
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

// ── DELETE /api/bookings/:id ─────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const booking = await db.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const b = booking.rows[0];
    if (b.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await db.query(
      "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    const io = req.app.get('io');
    await sendNotification(io, b.user_id, {
      title: '❌ Booking Cancelled',
      message: `Your booking "${b.title}" has been cancelled.`,
      type: 'warning',
    });

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

// ── GET /api/bookings/availability ──────────────────────────
router.get('/availability', authenticate, async (req, res) => {
  const { room_id, date } = req.query;
  if (!room_id || !date) {
    return res.status(400).json({ success: false, message: 'room_id and date required' });
  }

  try {
    const result = await db.query(
      `SELECT start_time, end_time, title
       FROM bookings
       WHERE room_id = $1
         AND DATE(start_time) = $2::date
         AND status = 'confirmed'
       ORDER BY start_time`,
      [room_id, date]
    );
    res.json({ success: true, booked_slots: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to check availability' });
  }
});

module.exports = router;
