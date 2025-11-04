-- PostgreSQL migration for KL SmartQ
-- Run this after deploying to create tables

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
  assigned_office_ids JSONB DEFAULT NULL,
  points INTEGER DEFAULT 0,
  badges JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS temp_registrations (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_temp_registrations_expires ON temp_registrations(expires_at);
