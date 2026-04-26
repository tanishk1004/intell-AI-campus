const express = require('express');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/analytics/dashboard ────────────────────────────
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      overview,
      bookingsByDay,
      complaintsByPriority,
      roomUtilization,
      hourlyHeatmap,
      recentActivity,
    ] = await Promise.all([
      // Overview stats
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as total_users,
          (SELECT COUNT(*) FROM rooms WHERE is_active = TRUE) as total_rooms,
          (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as active_bookings,
          (SELECT COUNT(*) FROM complaints WHERE status = 'open') as open_complaints,
          (SELECT COUNT(*) FROM bookings WHERE created_at >= NOW() - INTERVAL '24 hours') as bookings_today,
          (SELECT COUNT(*) FROM complaints WHERE created_at >= NOW() - INTERVAL '24 hours') as complaints_today
      `),

      // Bookings per day (last 7 days)
      db.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `),

      // Complaints by AI priority
      db.query(`
        SELECT ai_priority, COUNT(*) as count
        FROM complaints
        GROUP BY ai_priority
        ORDER BY CASE ai_priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
      `),

      // Room utilization %
      db.query(`
        SELECT r.name, r.type, r.building,
          COUNT(b.id) as total_bookings,
          ROUND(
            COUNT(b.id) * 100.0 / NULLIF(
              (SELECT COUNT(*) FROM bookings WHERE room_id = r.id AND status = 'confirmed'), 0
            ), 1
          ) as utilization_pct
        FROM rooms r
        LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'confirmed'
        WHERE r.is_active = TRUE
        GROUP BY r.id, r.name, r.type, r.building
        ORDER BY total_bookings DESC
      `),

      // Hourly heatmap (bookings by hour of day)
      db.query(`
        SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as count
        FROM bookings
        WHERE status = 'confirmed'
        GROUP BY EXTRACT(HOUR FROM start_time)
        ORDER BY hour
      `),

      // Recent activity
      db.query(`
        (SELECT 'booking' as type, title as description, created_at, u.name as user_name
         FROM bookings b JOIN users u ON b.user_id = u.id
         ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'complaint' as type, title as description, created_at, u.name as user_name
         FROM complaints c JOIN users u ON c.user_id = u.id
         ORDER BY created_at DESC LIMIT 5)
        ORDER BY created_at DESC LIMIT 10
      `),
    ]);

    res.json({
      success: true,
      analytics: {
        overview: overview.rows[0],
        bookings_by_day: bookingsByDay.rows,
        complaints_by_priority: complaintsByPriority.rows,
        room_utilization: roomUtilization.rows,
        hourly_heatmap: hourlyHeatmap.rows,
        recent_activity: recentActivity.rows,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

module.exports = router;
