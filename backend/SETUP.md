# KL SmartQ Backend - Setup and Run Guide

## Prerequisites
- **Java 17** (JDK 17.0.15+6 or higher)
- **Maven** (3.6+ recommended)
- **MySQL** (8.0+ recommended)
- **SMTP credentials** (Gmail or other) for email verification

## Database Setup

1. Create the MySQL database:
```sql
CREATE DATABASE kl_smartq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Update credentials in `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/kl_smartq?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: "YOUR_MYSQL_PASSWORD"
```

3. The application will auto-create tables on first run (`spring.jpa.hibernate.ddl-auto: update`).

## Email Configuration

Update SMTP settings in `application.yml`:
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: "your-email@gmail.com"
    password: "your-app-password"  # Use Gmail App Password, not account password
    properties.mail.smtp.auth: true
    properties.mail.smtp.starttls.enable: true
```

**Note:** For Gmail, you must generate an [App Password](https://support.google.com/accounts/answer/185833) if 2FA is enabled.

## Build and Run

### Set JAVA_HOME (PowerShell - Windows)
```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17.0.15+6'
$env:PATH = $env:JAVA_HOME + '\bin;' + $env:PATH
```

### Build the project
```powershell
cd C:\app\kl-smartq\backend
mvn clean package -DskipTests
```

### Run the application
```powershell
mvn spring-boot:run
```

Or run the JAR directly:
```powershell
java -jar target/kl-smartq-backend-java-1.0.0.jar
```

The backend will start on **http://localhost:8083**.

## API Endpoints

### Authentication (Public - no token required)

**1. Send Verification Code**
```bash
POST /api/auth/send-verification-code
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "P@ssw0rd!"
}
```

**2. Verify Code**
```bash
POST /api/auth/verify-code
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

**3. Complete Registration**
```bash
POST /api/auth/complete-registration
Content-Type: application/json

{
  "email": "john@example.com"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true,
    "points": 0
  },
  "expiresIn": 3600
}
```

**4. Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "P@ssw0rd!"
}

Response: (same as complete-registration)
```

### Protected Endpoints (Require Bearer token)

For protected endpoints, include the JWT token:
```bash
GET /api/some-protected-endpoint
Authorization: Bearer <token>
```

## Frontend Integration

The frontend is configured to call:
- **API Base URL:** `http://localhost:8083/api`
- **CORS:** Allowed origins include `http://localhost:5173`, `http://localhost:3000`, `http://localhost:8082`

### Store Token on Frontend
After login/registration, save the token:
```typescript
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.user));
```

### Call Protected APIs
```typescript
fetch('http://localhost:8083/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
```

## Testing with curl (PowerShell)

**Registration Flow:**
```powershell
# 1. Send verification code
curl -X POST http://localhost:8083/api/auth/send-verification-code `
  -H "Content-Type: application/json" `
  -d '{"name":"Alice","email":"alice@gmail.com","password":"P@ssw0rd!"}'

# 2. Check your email for the 6-digit code, then verify
curl -X POST http://localhost:8083/api/auth/verify-code `
  -H "Content-Type: application/json" `
  -d '{"email":"alice@gmail.com","code":"123456"}'

# 3. Complete registration (returns token)
curl -X POST http://localhost:8083/api/auth/complete-registration `
  -H "Content-Type: application/json" `
  -d '{"email":"alice@gmail.com"}'
```

**Login:**
```powershell
curl -X POST http://localhost:8083/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"alice@gmail.com","password":"P@ssw0rd!"}'
```

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (e.g., !@#$%^&*)

## Troubleshooting

### 1. Email not sending
- Check SMTP credentials in `application.yml`
- Ensure Gmail App Password is used (not account password)
- Check firewall/antivirus blocking port 587
- Look for errors in backend logs

### 2. Database connection errors
- Verify MySQL is running
- Check credentials in `application.yml`
- Ensure database `kl_smartq` exists

### 3. CORS errors in browser
- Verify frontend origin is in `cors.allowed-origins` (application.yml)
- Check browser console for specific CORS error

### 4. JWT validation fails
- Token expired (default 3600 seconds = 1 hour)
- Token was issued by different secret (check `jwt.secret` in application.yml)
- Token format invalid (must be `Bearer <token>`)

## Development Notes

- **Security:** Change `jwt.secret` to a strong 32+ byte secret in production
- **Email:** For local dev, consider using [Mailtrap](https://mailtrap.io/) or logging codes to console
- **Profiles:** You can create `application-dev.yml` and `application-prod.yml` for environment-specific configs
- **Database migrations:** SQL migration files are in `backend/migrations/` if you prefer manual schema management

## Project Structure
```
backend/
├── src/main/java/com/klsmartq/
│   ├── config/              # Security, CORS, Exception handlers
│   ├── controller/          # REST API endpoints
│   ├── dto/                 # Data Transfer Objects
│   ├── entity/              # JPA entities (User, TempRegistration)
│   ├── repository/          # Spring Data JPA repositories
│   └── service/             # Business logic (AuthService, JwtUtil)
├── src/main/resources/
│   └── application.yml      # Configuration
└── pom.xml                  # Maven dependencies
```

## Next Steps
- Add role-based authorization (ADMIN, STAFF, STUDENT)
- Implement token refresh endpoint
- Add password reset flow
- Create user profile endpoints
- Add comprehensive unit/integration tests
