package com.klsmartq.controller;

import com.klsmartq.dto.AuthResponse;
import com.klsmartq.dto.LoginRequest;
import com.klsmartq.dto.RegisterRequest;
import com.klsmartq.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173", "http://localhost:8082"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/send-verification-code")
    public ResponseEntity<?> sendCode(@RequestBody RegisterRequest r) {
        System.out.println("→ /send-verification-code called for email: " + r.getEmail());
        authService.startRegistration(r.getName(), r.getEmail(), r.getPassword());
        return ResponseEntity.ok().body(java.util.Map.of("message", "Verification code sent"));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody java.util.Map<String,String> body) {
        String email = body.get("email"); String code = body.get("code");
        authService.verifyCode(email, code);
        return ResponseEntity.ok().body(java.util.Map.of("message", "Code verified"));
    }

    @PostMapping("/complete-registration")
    public ResponseEntity<AuthResponse> complete(@RequestBody java.util.Map<String,String> body) {
        AuthResponse resp = authService.completeRegistration(body.get("email"));
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        System.out.println("→ /login called for email: " + req.getEmail());
        try {
            AuthResponse resp = authService.login(req.getEmail(), req.getPassword());
            System.out.println("✓ Login successful for: " + req.getEmail());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            System.err.println("✗ Login failed for " + req.getEmail() + ": " + e.getMessage());
            throw e;
        }
    }
}
