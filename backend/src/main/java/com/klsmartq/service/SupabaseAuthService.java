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
     * Student self-registration: creates Supabase auth user with OTP verification
     */
    public void registerStudent(String name, String email, String password) {
        try {
            // First, create a temporary user record in our database
            // We'll get the actual Supabase ID after OTP verification
            
            // Prepare signup request
            Map<String, Object> signUpData = new HashMap<>();
            signUpData.put("email", email);
            signUpData.put("password", password);
            
            // Add user metadata
            Map<String, Object> userMetadata = new HashMap<>();
            userMetadata.put("name", name);
            signUpData.put("user_metadata", userMetadata);

            String json = objectMapper.writeValueAsString(signUpData);
            
            RequestBody body = RequestBody.create(
                json, 
                MediaType.parse("application/json")
            );

            // Call Supabase Auth API
            Request request = new Request.Builder()
                    .url(supabaseConfig.getSupabaseUrl() + "/auth/v1/signup")
                    .addHeader("apikey", supabaseConfig.getSupabaseAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "No error details";
                    throw new IllegalStateException("Supabase signup failed: " + errorBody);
                }

                String responseBody = response.body().string();
                System.out.println("Supabase signup response: " + responseBody);
                
                @SuppressWarnings("unchecked")
                Map<String, Object> responseData = objectMapper.readValue(responseBody, Map.class);
                
                // When email confirmation is required, Supabase may not return user data immediately
                // The user will be created after OTP verification
                @SuppressWarnings("unchecked")
                Map<String, Object> userData = (Map<String, Object>) responseData.get("user");
                
                if (userData != null && userData.get("id") != null) {
                    String supabaseUserId = (String) userData.get("id");

                    // Create profile in our database
                    User user = new User();
                    user.setId(supabaseUserId);
                    user.setName(name);
                    user.setEmail(email.toLowerCase());
                    user.setRole("STUDENT");
                    user.setEmailVerified(false);
                    user.setPasswordHash("");
                    userRepository.save(user);
                    
                    System.out.println("✓ Student registered: " + email + " (Supabase ID: " + supabaseUserId + ")");
                } else {
                    // User will be created in database after OTP verification
                    // Store temporary registration data
                    System.out.println("✓ Registration initiated for: " + email + " (awaiting email confirmation)");
                }
                
                System.out.println("✓ Verification email sent by Supabase");
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
            Map<String, Object> verifyData = new HashMap<>();
            verifyData.put("email", email);
            verifyData.put("token", token);
            verifyData.put("type", "signup");

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
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "Invalid code";
                    System.err.println("OTP verification failed: " + errorBody);
                    throw new IllegalArgumentException("Invalid or expired OTP code");
                }

                String responseBody = response.body().string();
                System.out.println("OTP verification response: " + responseBody);
                
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
                        userRepository.save(user);
                        
                        System.out.println("✓ User profile created for: " + email + " (ID: " + userId + ")");
                    } else {
                        // Update email verification status
                        userRepository.findById(userId).ifPresent(user -> {
                            user.setEmailVerified(true);
                            userRepository.save(user);
                        });
                    }
                    
                    System.out.println("✓ OTP verified for: " + email);
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
                if (!response.isSuccessful()) {
                    throw new IllegalArgumentException("Invalid credentials");
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> responseData = objectMapper.readValue(
                    response.body().string(), 
                    Map.class
                );
                
                @SuppressWarnings("unchecked")
                Map<String, Object> userData = (Map<String, Object>) responseData.get("user");
                String supabaseUserId = (String) userData.get("id");
                String emailConfirmedAt = (String) userData.get("email_confirmed_at");
                boolean emailVerified = emailConfirmedAt != null;

                // Get user profile from database
                User user = userRepository.findById(supabaseUserId)
                        .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

                // Update email verification status
                if (emailVerified && !user.isEmailVerified()) {
                    user.setEmailVerified(true);
                    userRepository.save(user);
                }

                if (!emailVerified) {
                    throw new IllegalStateException("Email not verified. Please check your email.");
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
                userRepository.save(user);

                System.out.println("✓ Staff/Admin user created: " + email + " (Role: " + role + ")");
            }

        } catch (IOException e) {
            System.err.println("✗ Failed to create staff user: " + e.getMessage());
            throw new IllegalStateException("Failed to create staff user: " + e.getMessage());
        }
    }
}
