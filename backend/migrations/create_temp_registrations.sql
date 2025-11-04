-- Migration: create temp_registrations table (for OTP flow)

CREATE TABLE IF NOT EXISTS `temp_registrations` (
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `code` VARCHAR(16) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `verified` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
