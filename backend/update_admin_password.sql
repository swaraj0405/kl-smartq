UPDATE users SET password_hash = '$2b$10$vTBwPSqNBkmojTHIngN6LOGFPWq3bZyMXYMvICTO3qoGzb2Mhwct.' WHERE email = 'paramjitbaral44@gmail.com';
SELECT email, password_hash FROM users WHERE email = 'paramjitbaral44@gmail.com';
