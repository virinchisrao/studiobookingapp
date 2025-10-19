-- backend/database_schema.sql
-- Simplified Phase 1 Schema for Studio Booking App

-- ============================================
-- TABLE 1: USERS
-- ============================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'owner', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- TABLE 2: STUDIOS
-- ============================================
CREATE TABLE studios (
    studio_id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 3: RESOURCES (Rooms within studios)
-- ============================================
CREATE TABLE resources (
    resource_id SERIAL PRIMARY KEY,
    studio_id INTEGER NOT NULL REFERENCES studios(studio_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) CHECK (resource_type IN ('live_room', 'control_room', 'booth', 'rehearsal')),
    description TEXT,
    base_price_per_hour DECIMAL(10, 2) NOT NULL,
    max_occupancy INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 4: AVAILABILITY TEMPLATE (Weekly schedule)
-- ============================================
CREATE TABLE availability_template (
    template_id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_id, day_of_week)
);

-- ============================================
-- TABLE 5: BOOKINGS
-- ============================================
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    studio_id INTEGER NOT NULL REFERENCES studios(studio_id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_approval' CHECK (
        status IN ('pending_approval', 'approved', 'rejected', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded')
    ),
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(user_id),
    rejection_reason TEXT,
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,
    refund_percentage DECIMAL(5, 2),
    refund_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 6: EVENT LOG (Audit trail)
-- ============================================
CREATE TABLE event_log (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    booking_id INTEGER REFERENCES bookings(booking_id),
    studio_id INTEGER REFERENCES studios(studio_id),
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    meta_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for better performance
-- ============================================
CREATE INDEX idx_studios_owner ON studios(owner_id);
CREATE INDEX idx_resources_studio ON resources(studio_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_event_log_user ON event_log(user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Database schema created successfully!' as message;