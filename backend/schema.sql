-- ============================================================
-- IntelliCampus AI+ Database Schema
-- PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    department VARCHAR(100),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ROOMS TABLE
-- ============================================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('classroom', 'lab', 'seminar', 'auditorium', 'meeting')),
    amenities TEXT[], -- e.g. ['projector', 'ac', 'whiteboard']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    attendees_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT no_overlap EXCLUDE USING gist (
        room_id WITH =,
        tsrange(start_time, end_time) WITH &&
    ) WHERE (status != 'cancelled')
);

-- ============================================================
-- COMPLAINTS TABLE
-- ============================================================
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('maintenance', 'cleanliness', 'equipment', 'safety', 'noise', 'other')),
    ai_priority VARCHAR(20) DEFAULT 'medium' CHECK (ai_priority IN ('critical', 'high', 'medium', 'low')),
    ai_confidence FLOAT DEFAULT 0.0,
    ai_suggested_category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- ============================================================
-- PREDICTIONS TABLE
-- ============================================================
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    predicted_for TIMESTAMP NOT NULL,
    availability_probability FLOAT NOT NULL CHECK (availability_probability BETWEEN 0 AND 1),
    predicted_occupancy INTEGER,
    confidence_score FLOAT,
    model_version VARCHAR(20) DEFAULT 'v1.0',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'booking', 'complaint')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ROOM USAGE LOGS (for heatmap analytics)
-- ============================================================
CREATE TABLE room_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    logged_at TIMESTAMP DEFAULT NOW(),
    occupancy_count INTEGER DEFAULT 0,
    source VARCHAR(30) DEFAULT 'booking' CHECK (source IN ('booking', 'sensor', 'manual'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_bookings_room_time ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_complaints_user ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_predictions_room_time ON predictions(room_id, predicted_for);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_usage_logs_room ON room_usage_logs(room_id, logged_at);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: Admin@123)
INSERT INTO users (name, email, password_hash, role, department) VALUES
('Admin User', 'admin@intellicampus.ai', '$2b$10$rQZ9uAVUE5gKJ3mN8pL2/.hash_placeholder_admin', 'admin', 'Administration'),
('John Student', 'student@intellicampus.ai', '$2b$10$rQZ9uAVUE5gKJ3mN8pL2/.hash_placeholder_student', 'student', 'Computer Science'),
('Alice Johnson', 'alice@intellicampus.ai', '$2b$10$rQZ9uAVUE5gKJ3mN8pL2/.hash_placeholder_alice', 'student', 'Electronics'),
('Bob Smith', 'bob@intellicampus.ai', '$2b$10$rQZ9uAVUE5gKJ3mN8pL2/.hash_placeholder_bob', 'student', 'Mechanical');

-- Rooms
INSERT INTO rooms (name, building, floor, capacity, type, amenities) VALUES
('CS Lab 101', 'Tech Block A', 1, 40, 'lab', ARRAY['computers', 'projector', 'ac', 'whiteboard']),
('CS Lab 102', 'Tech Block A', 1, 40, 'lab', ARRAY['computers', 'projector', 'ac']),
('Seminar Hall A', 'Main Block', 2, 80, 'seminar', ARRAY['projector', 'ac', 'mic', 'whiteboard']),
('Classroom 201', 'Main Block', 2, 60, 'classroom', ARRAY['projector', 'ac', 'whiteboard']),
('Classroom 202', 'Main Block', 2, 60, 'classroom', ARRAY['projector', 'whiteboard']),
('Electronics Lab', 'Tech Block B', 1, 30, 'lab', ARRAY['equipment', 'ac', 'whiteboard']),
('Meeting Room 1', 'Admin Block', 1, 15, 'meeting', ARRAY['tv', 'ac', 'whiteboard']),
('Auditorium', 'Main Block', 0, 500, 'auditorium', ARRAY['stage', 'mic', 'projector', 'ac']),
('Research Lab', 'Tech Block A', 2, 20, 'lab', ARRAY['computers', 'servers', 'ac']),
('Classroom 301', 'Main Block', 3, 60, 'classroom', ARRAY['projector', 'ac', 'whiteboard']);
