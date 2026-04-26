/**
 * Database seeder — run with: node src/utils/seed.js
 * Creates demo users with properly hashed passwords
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

async function seed() {
  console.log('🌱 Seeding database...');

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  // Update demo user passwords
  await db.query(`
    UPDATE users SET password_hash = $1 WHERE email = 'admin@intellicampus.ai'
  `, [adminHash]);

  await db.query(`
    UPDATE users SET password_hash = $1 WHERE email = 'student@intellicampus.ai'
  `, [studentHash]);

  await db.query(`
    UPDATE users SET password_hash = $1 WHERE email = 'alice@intellicampus.ai'
  `, [studentHash]);

  await db.query(`
    UPDATE users SET password_hash = $1 WHERE email = 'bob@intellicampus.ai'
  `, [studentHash]);

  console.log('✅ Passwords updated for demo users');
  console.log('   admin@intellicampus.ai / Admin@123');
  console.log('   student@intellicampus.ai / Student@123');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
