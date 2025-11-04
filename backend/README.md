kl-smartq Java auth backend
===========================

This is a small Spring Boot copy of the Campus-Beats auth logic (register/login/OTP flow) intended to run locally for kl-smartq.

How to run (development)

1. Create a MySQL database and run migrations (see `migrations` in `kl-smartq/backend` or use JPA `ddl-auto: update`).
2. Configure environment variables or edit `application.yml` for DB and SMTP settings.
3. Build & run:

```
cd kl-smartq/backend
mvn -q -DskipTests package
java -jar target/kl-smartq-backend-java-1.0.0.jar
```

Endpoints
- POST /api/auth/send-verification-code  { name,email,password }
- POST /api/auth/verify-code             { email, code }
- POST /api/auth/complete-registration   { email }
- POST /api/auth/login                   { email, password }
- GET  /api/auth/validate                Authorization: Bearer <token>

Configuration
- `application.yml` contains placeholders for DB and SMTP settings and sets server port to 8083.

Notes
- This app aims to mirror Campus-Beats' auth flow and validations. If you want exact copy of email templates, token claims, or domain restrictions, paste the original Campus-Beats snippets and I'll swap them in.
kl-smartq auth backend
======================

This is a minimal Node/Express auth backend used for local development of the kl-smartq frontend. It implements:

- POST /api/auth/register  { name, email, password, confirmPassword }
- POST /api/auth/login     { email, password }
- GET  /api/auth/validate  Authorization: Bearer <token>

By default it listens on port 8082. Configure via environment variables:

- PORT (defaults to 8082)
- JWT_SECRET (defaults to 'dev-secret-kl-smartq')

Start:

```
cd kl-smartq/backend
npm install
npm start
```

User data is stored in `users.json` by default (simple file store for dev). You can optionally connect this service to MySQL for persistent storage.

To enable MySQL:

1. Create a database (e.g., `kl_smartq`) and run the migration in `migrations/create_users.sql`.

2. Start the server with environment variables (example):

```
SET DB_HOST=127.0.0.1
SET DB_PORT=3306
SET DB_NAME=kl_smartq
SET DB_USER=myuser
SET DB_PASSWORD=mypassword
SET USE_MYSQL=true
SET JWT_SECRET=your_jwt_secret
node server.js
```

On PowerShell use `$env:DB_HOST = '127.0.0.1'` etc. The server will connect to MySQL when `USE_MYSQL=true`.

When connected to MySQL, users are stored in the `users` table and endpoints behave the same as the file-backed mode.

