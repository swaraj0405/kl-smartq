package com.klsmartq.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.klsmartq.config.SupabaseConfig;
import com.klsmartq.dto.AuthResponse;
import com.klsmartq.dto.UserDTO;
import com.klsmartq.entity.User;
import com.klsmartq.repository.UserRepository;
import com.klsmartq.util.JsonUtils;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class SupabaseAuthService {

    private final SupabaseConfig supabaseConfig;
    private final OkHttpClient httpClient;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Value("${jwt.expiration:3600}")
    private long jwtExpiration;

    public SupabaseAuthService(SupabaseConfig supabaseConfig, OkHttpClient httpClient, 
                              UserRepository userRepository, JwtUtil jwtUtil) {
        this.supabaseConfig = supabaseConfig;
        this.httpClient = httpClient;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Student self-registration: creates Supabase auth user then sends OTP separately
     * Step 1: Create user with auto-confirm using admin API
     * Step 2: Send OTP code via /auth/v1/otp endpoint
     */
    public void registerStudent(String name, String email, String password) {
        try {
            // Step 1: Create user with auto-confirm (using service role key)
            Map<String, Object> signupData = new HashMap<>();
            signupData.put("email", email);
            signupData.put("password", password);
            signupData.put("email_confirm", true); // Auto-confirm the email
            
            // Store name in user metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("name", name);
            signupData.put("user_metadata", metadata);

            String json = objectMapper.writeValueAsString(signupData);
            
            RequestBody body = RequestBody.create(
                json, 
                MediaType.parse("application/json")
            );

            // Use admin endpoint to create user with auto-confirm
            Request request = new Request.Builder()
                    .url(supabaseConfig.getSupabaseUrl() + "/auth/v1/admin/users")
                    .addHeader("apikey", supabaseConfig.getSupabaseServiceRoleKey())
                    .addHeader("Authorization", "Bearer " + supabaseConfig.getSupabaseServiceRoleKey())
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();

            String userId = null;
            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                System.out.println("Supabase admin signup response: " + responseBody);
                
                if (!response.isSuccessful()) {
                    System.err.println("Admin signup failed: " + responseBody);
                    
                    if (responseBody.contains("already registered") || responseBody.contains("already exists")) {
                        throw new IllegalArgumentException("Email already registered");
                    }
                    throw new IllegalStateException("Registration failed: " + responseBody);
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> userData = objectMapper.readValue(responseBody, Map.class);
                userId = (String) userData.get("id");
                
                // Create user profile in database (email not verified yet)
                User user = new User();
                user.setId(userId);
                user.setName(name);
                user.setEmail(email.toLowerCase());
                user.setRole("STUDENT");
                user.setEmailVerified(false); // Will be true after OTP verification
                user.setPasswordHash("");
                user.setAssignedOfficeIds(null); // JSON field must be null, not empty string
                user.setBadges(null); // JSON field must be null, not empty string
                
                userRepository.save(user);
                System.out.println("✓ User created: " + email + " (ID: " + userId + ")");
            }

            // Step 2: Send OTP code via Supabase OTP API
            Map<String, Object> otpData = new HashMap<>();
            otpData.put("email", email);
            otpData.put("create_user", false); // User already exists

            String otpJson = objectMapper.writeValueAsString(otpData);
            RequestBody otpBody = RequestBody.create(otpJson, MediaType.parse("application/json"));

            Request otpRequest = new Request.Builder()
                    .url(supabaseConfig.getSupabaseUrl() + "/auth/v1/otp")
                    .addHeader("apikey", supabaseConfig.getSupabaseAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .post(otpBody)
                    .build();

            try (Response otpResponse = httpClient.newCall(otpRequest).execute()) {
                String otpResponseBody = otpResponse.body() != null ? otpResponse.body().string() : "";
                System.out.println("OTP send response: " + otpResponseBody);
                
                if (!otpResponse.isSuccessful()) {
                    System.err.println("Failed to send OTP: " + otpResponseBody);
                    throw new IOException("Failed to send OTP code");
                }
                
                System.out.println("✓ OTP code sent to: " + email);
            }

        } catch (IOException e) {
            System.err.println("✗ Failed to register student: " + e.getMessage());
            throw new IllegalStateException("Registration failed: " + e.getMessage());
        }
    }

    /**
     * Verify OTP code sent to email
     */
    public void verifyOtp(String email, String token) {
        try {
            // Supabase expects the OTP in a specific format
            Map<String, Object> verifyData = new HashMap<>();
            verifyData.put("email", email);
            verifyData.put("token", token);
            verifyData.put("type", "email"); // Changed from "signup" to "email" for OTP verification

            String json = objectMapper.writeValueAsString(verifyData);
            
            RequestBody body = RequestBody.create(
                json, 
                MediaType.parse("application/json")
            );

            Request request = new Request.Builder()
                    .url(supabaseConfig.getSupabaseUrl() + "/auth/v1/verify")
                    .addHeader("apikey", supabaseConfig.getSupabaseAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                
                System.out.println("OTP verification status: " + response.code());
                System.out.println("OTP verification response: " + responseBody);
                
                if (!response.isSuccessful()) {
                    System.err.println("OTP verification failed with status " + response.code() + ": " + responseBody);
                    throw new IllegalArgumentException("Invalid or expired OTP code");
                }
                
                @SuppressWarnings("unchecked")
                Map<String, Object> responseData = objectMapper.readValue(responseBody, Map.class);
                
                @SuppressWarnings("unchecked")
                Map<String, Object> userData = (Map<String, Object>) responseData.get("user");
                
                if (userData != null && userData.get("id") != null) {
                    String userId = (String) userData.get("id");
                    
                    // Check if user profile already exists
                    if (!userRepository.existsById(userId)) {
                        // Get name from user metadata
                        @SuppressWarnings("unchecked")
                        Map<String, Object> userMetadata = (Map<String, Object>) userData.get("user_metadata");
                        String name = userMetadata != null ? (String) userMetadata.get("name") : "Student";
                        
                        // Create user profile now that email is verified
                        User user = new User();
                        user.setId(userId);
                        user.setName(name);
                        user.setEmail(email.toLowerCase());
                        user.setRole("STUDENT");
                        user.setEmailVerified(true);
                        user.setPasswordHash("");
                        user.setAssignedOfficeIds(null); // JSON field must be null
                        user.setBadges(null); // JSON field must be null
                        userRepository.save(user);
                        
                        System.out.println("✓ User profile created for: " + email + " (ID: " + userId + ")");
                    } else {
                        // Update email verification status
                        userRepository.findById(userId).ifPresent(user -> {
                            user.setEmailVerified(true);
                            userRepository.save(user);
                        });
                    }
                    
                    System.out.println("✓ OTP verified successfully for: " + email);
                }
            }

        } catch (IOException e) {
            System.err.println("✗ OTP verification failed: " + e.getMessage());
            throw new IllegalStateException("OTP verification failed: " + e.getMessage());
        }
    }

    /**
     * Login with Supabase Auth
     */
    public AuthResponse login(String email, String password) {
        try {
            // Prepare login request
            Map<String, Object> loginData = new HashMap<>();
            loginData.put("email", email);
            loginData.put("password", password);

            String json = objectMapper.writeValueAsString(loginData);
            
            RequestBody body = RequestBody.create(
                json, 
                MediaType.parse("application/json")
            );

            // Call Supabase Auth API
            Request request = new Request.Builder()
                    .url(supabaseConfig.getSupabaseUrl() + "/auth/v1/token?grant_type=password")
                    .addHeader("apikey", supabaseConfig.getSupabaseAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                
                System.out.println("Login status: " + response.code());
                System.out.println("Login response: " + responseBody);
                
                if (!response.isSuccessful()) {
                    throw new IllegalArgumentException("Invalid email or password");
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> responseData = objectMapper.readValue(responseBody, Map.class);
                
                @SuppressWarnings("unchecked")
                Map<String, Object> userData = (Map<String, Object>) responseData.get("user");
                
                if (userData == null || userData.get("id") == null) {
                    throw new IllegalArgumentException("Invalid credentials");
                }
                
                String supabaseUserId = (String) userData.get("id");
                String emailConfirmedAt = (String) userData.get("email_confirmed_at");
                boolean emailVerified = emailConfirmedAt != null;

                if (!emailVerified) {
                    throw new IllegalStateException("Email not verified. Please verify your email first.");
                }

                // Get or create user profile from database
                User user = userRepository.findById(supabaseUserId).orElseGet(() -> {
                    // User verified in Supabase but profile not in our DB - create it now
                    System.out.println("⚠️ User verified in Supabase but missing in DB - creating profile for: " + email);
                    
                    @SuppressWarnings("unchecked")
                    Map<String, Object> userMetadata = (Map<String, Object>) userData.get("user_metadata");
                    String name = userMetadata != null ? (String) userMetadata.get("name") : "Student";
                    
                    User newUser = new User();
                    newUser.setId(supabaseUserId);
                    newUser.setName(name);
                    newUser.setEmail(email.toLowerCase());
                    newUser.setRole("STUDENT");
                    newUser.setEmailVerified(true);
                    newUser.setPasswordHash("");
                    newUser.setAssignedOfficeIds(null); // JSON field must be null
                    newUser.setBadges(null); // JSON field must be null
                    
                    return userRepository.save(newUser);
                });

                // Update email verification status if needed
                if (!user.isEmailVerified()) {
                    user.setEmailVerified(true);
                    userRepository.save(user);
                }

                // Generate our JWT token
                String token = jwtUtil.generateToken(user.getId(), user.getEmail(), jwtExpiration);

                UserDTO dto = new UserDTO(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.isEmailVerified(),
                    user.getRole(),
                    user.getPoints(),
                    JsonUtils.readStringList(user.getAssignedOfficeIds())
                );

                System.out.println("✓ Login successful: " + email);
                return new AuthResponse(token, dto, jwtExpiration);
            }

        } catch (IOException e) {
            System.err.println("✗ Login failed for " + email + ": " + e.getMessage());
            throw new IllegalStateException("Login failed: " + e.getMessage());
        }
    }

    /**
     * Admin creates staff/admin user (requires service role key)
     */
    public void createStaffUser(String name, String email, String role, String tempPassword) {
        try {
            // Prepare admin user creation request
            Map<String, Object> createData = new HashMap<>();
            createData.put("email", email);
            createData.put("password", tempPassword);
            createData.put("email_confirm", true); // Auto-confirm for staff
            
            // Add user metadata
            Map<String, Object> userMetadata = new HashMap<>();
            userMetadata.put("name", name);
            userMetadata.put("role", role);
            createData.put("user_metadata", userMetadata);

            String json = objectMapper.writeValueAsString(createData);
            
            RequestBody body = RequestBody.create(
                json, 
                MediaType.parse("application/json")
            );

            // Call Supabase Admin API (requires service role key)
            Request request = new Request.Builder()
                    .url(supabaseConfig.getSupabaseUrl() + "/auth/v1/admin/users")
                    .addHeader("apikey", supabaseConfig.getSupabaseServiceRoleKey())
                    .addHeader("Authorization", "Bearer " + supabaseConfig.getSupabaseServiceRoleKey())
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "No error details";
                    throw new IllegalStateException("Failed to create staff user in Supabase: " + errorBody);
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> responseData = objectMapper.readValue(
                    response.body().string(), 
                    Map.class
                );
                
                String supabaseUserId = (String) responseData.get("id");

                // Create profile in our database
                User user = new User();
                user.setId(supabaseUserId);
                user.setName(name);
                user.setEmail(email.toLowerCase());
                user.setRole(role); // STAFF or ADMIN
                user.setEmailVerified(true);
                user.setPasswordHash(""); // Managed by Supabase
                user.setAssignedOfficeIds(null); // JSON field must be null
                user.setBadges(null); // JSON field must be null
                userRepository.save(user);

                System.out.println("✓ Staff/Admin user created: " + email + " (Role: " + role + ")");
            }

        } catch (IOException e) {
            System.err.println("✗ Failed to create staff user: " + e.getMessage());
            throw new IllegalStateException("Failed to create staff user: " + e.getMessage());
        }
    }
}
