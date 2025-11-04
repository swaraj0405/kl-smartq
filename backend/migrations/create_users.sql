-- Migration: create users table for kl-smartq
-- Run this with a MySQL client (mysql CLI or workbench) against the target database

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_email_verified` TINYINT(1) DEFAULT 0,
  `role` VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
  `assigned_office_ids` JSON DEFAULT NULL,
  `points` INT DEFAULT 0,
  `badges` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
