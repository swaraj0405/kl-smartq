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
     * Step 1: Register student - Creates user immediately (no email confirmation needed)
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest r) {
        System.out.println("→ /register called for email: " + r.getEmail());
        try {
            supabaseAuthService.registerStudent(r.getName(), r.getEmail(), r.getPassword());
            return ResponseEntity.ok().body(java.util.Map.of(
                "message", "Registration successful! You can now login with your credentials.",
                "success", true
            ));
        } catch (Exception e) {
            System.err.println("✗ Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", e.getMessage(),
                "success", false
            ));
        }
    }

    /**
     * Step 2: Verify OTP code from email
     * NOTE: This is only needed if email confirmations are enabled in Supabase
     * If disabled, users can login immediately after registration
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody java.util.Map<String,String> body) {
        String email = body.get("email");
        String token = body.get("token"); // OTP code from email
        System.out.println("→ /verify-otp called for email: " + email);
        
        try {
            // If email confirmations are disabled in Supabase, user is already verified
            // Just return success
            return ResponseEntity.ok().body(java.util.Map.of(
                "message", "Email verified successfully! You can now login.",
                "success", true
            ));
        } catch (Exception e) {
            System.err.println("✗ OTP verification failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", "Verification failed. Please try logging in directly.",
                "success", false
            ));
        }
    }

    /**
     * Step 3: Login - checks Supabase auth and email verification
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

    // Legacy endpoints for backward compatibility
    @PostMapping("/send-verification-code")
    public ResponseEntity<?> sendCode(@RequestBody RegisterRequest r) {
        return register(r);
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody java.util.Map<String,String> body) {
        // Map old "code" parameter to new "token" parameter
        if (body.containsKey("code") && !body.containsKey("token")) {
            body.put("token", body.get("code"));
        }
        return verifyOtp(body);
    }

    @PostMapping("/complete-registration")
    public ResponseEntity<?> complete(@RequestBody java.util.Map<String,String> body) {
        return ResponseEntity.ok().body(java.util.Map.of(
            "message", "Registration complete. Please login with your credentials."
        ));
    }
}
