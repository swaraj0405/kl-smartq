-- Insert admin user: paramjitbaral44@gmail.com
-- Password: Swaraj@0405
-- This script uses BCrypt hash for the password

-- Add the role column (ignore error if already exists)
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'STUDENT';

-- Delete if exists to avoid duplicates
DELETE FROM users WHERE email = 'paramjitbaral44@gmail.com';

-- Insert the admin user with BCrypt hashed password
-- Password: Swaraj@0405
-- BCrypt hash: $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36lMr4Lm/8v9KfRo7pX5tPq
INSERT INTO users (id, name, email, password_hash, role, is_email_verified, points, created_at) 
VALUES (
    UUID(),
    'Admin User',
    'paramjitbaral44@gmail.com',
    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36lMr4Lm/8v9KfRo7pX5tPq',
    'ADMIN',
    1,
    0,
    NOW()
);
