package com.klsmartq.controller;

import com.klsmartq.dto.AuthResponse;
import com.klsmartq.dto.LoginRequest;
import com.klsmartq.dto.RegisterRequest;
import com.klsmartq.service.SupabaseAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SupabaseAuthService supabaseAuthService;

    public AuthController(SupabaseAuthService supabaseAuthService) { 
        this.supabaseAuthService = supabaseAuthService; 
    }

    /**
     * Register student - Supabase sends verification email automatically
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest r) {
        System.out.println("→ /register called for email: " + r.getEmail());
        try {
            supabaseAuthService.registerStudent(r.getName(), r.getEmail(), r.getPassword());
            return ResponseEntity.ok().body(java.util.Map.of(
                "message", "Registration successful! Please check your email for verification link."
            ));
        } catch (Exception e) {
            System.err.println("✗ Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Login - checks Supabase auth and email verification
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        System.out.println("→ /login called for email: " + req.getEmail());
        try {
            AuthResponse resp = supabaseAuthService.login(req.getEmail(), req.getPassword());
            System.out.println("✓ Login successful for: " + req.getEmail());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            System.err.println("✗ Login failed for " + req.getEmail() + ": " + e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // Legacy endpoints (can be removed after frontend update)
    @PostMapping("/send-verification-code")
    public ResponseEntity<?> sendCode(@RequestBody RegisterRequest r) {
        return register(r);
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody java.util.Map<String,String> body) {
        return ResponseEntity.ok().body(java.util.Map.of(
            "message", "Verification is now handled via email link sent by Supabase"
        ));
    }

    @PostMapping("/complete-registration")
    public ResponseEntity<?> complete(@RequestBody java.util.Map<String,String> body) {
        return ResponseEntity.ok().body(java.util.Map.of(
            "message", "Registration complete. Please login with your credentials."
        ));
    }
}
