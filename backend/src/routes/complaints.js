const express = require('express');
const axios = require('axios');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/complaints ──────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { status, priority } = req.query;

    let query = `
      SELECT c.*, u.name as submitted_by, r.name as room_name,
             a.name as assigned_to_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN rooms r ON c.room_id = r.id
      LEFT JOIN users a ON c.assigned_to = a.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (!isAdmin) { query += ` AND c.user_id = $${idx++}`; params.push(req.user.id); }
    if (status) { query += ` AND c.status = $${idx++}`; params.push(status); }
    if (priority) { query += ` AND c.ai_priority = $${idx++}`; params.push(priority); }

    query += ' ORDER BY CASE c.ai_priority WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END, c.created_at DESC';

    const result = await db.query(query, params);
    res.json({ success: true, complaints: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// ── POST /api/complaints ─────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { title, description, room_id } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description required' });
  }

  try {
    // Call AI service for classification
    let aiResult = { priority: 'medium', category: 'other', confidence: 0.5, reasoning: '' };
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/classify-complaint`, {
        title,
        description,
      });
      aiResult = aiResponse.data;
    } catch (aiErr) {
      console.warn('AI service unavailable, using default classification');
    }

    const result = await db.query(
      `INSERT INTO complaints
         (user_id, room_id, title, description, category, ai_priority, ai_confidence, ai_suggested_category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        room_id || null,
        title,
        description,
        aiResult.category,
        aiResult.priority,
        aiResult.confidence,
        aiResult.category,
      ]
    );

    const complaint = result.rows[0];

    // Notify admins of critical/high priority
    if (['critical', 'high'].includes(aiResult.priority)) {
      const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
      const io = req.app.get('io');
      for (const admin of admins.rows) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'warning')`,
          [
            admin.id,
            `🚨 ${aiResult.priority.toUpperCase()} Priority Complaint`,
            `"${title}" requires immediate attention.`,
          ]
        );
        io.to(`user-${admin.id}`).emit('notification', {
          title: `🚨 ${aiResult.priority.toUpperCase()} Priority Complaint`,
          message: `"${title}" requires immediate attention.`,
          type: 'warning',
        });
      }
    }

    res.status(201).json({
      success: true,
      complaint,
      ai_analysis: aiResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to submit complaint' });
  }
});

// ── PATCH /api/complaints/:id ────────────────────────────────
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { status, assigned_to, resolution_notes } = req.body;
  try {
    const updates = [];
    const params = [];
    let idx = 1;

    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (assigned_to) { updates.push(`assigned_to = $${idx++}`); params.push(assigned_to); }
    if (resolution_notes) { updates.push(`resolution_notes = $${idx++}`); params.push(resolution_notes); }
    if (status === 'resolved') { updates.push(`resolved_at = NOW()`); }
    updates.push(`updated_at = NOW()`);

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE complaints SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Notify the complaint owner
    const complaint = result.rows[0];
    const io = req.app.get('io');
    io.to(`user-${complaint.user_id}`).emit('notification', {
      title: '📋 Complaint Updated',
      message: `Your complaint "${complaint.title}" status changed to ${status}.`,
      type: 'info',
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update complaint' });
  }
});

module.exports = router;
