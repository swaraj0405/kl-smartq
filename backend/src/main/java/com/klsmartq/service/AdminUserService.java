package com.klsmartq.service;

import com.klsmartq.dto.AdminCreateUserRequest;
import com.klsmartq.dto.AdminUpdateUserRequest;
import com.klsmartq.dto.UserDTO;
import com.klsmartq.entity.User;
import com.klsmartq.repository.UserRepository;
import com.klsmartq.util.JsonUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private static final Set<String> ALLOWED_ROLES = Set.of("ADMIN", "STAFF", "STUDENT");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public UserDTO createUser(AdminCreateUserRequest request) {
        validateCreateRequest(request);

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail)
            .ifPresent(u -> { throw new IllegalStateException("Email already registered"); });

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        String role = normalizeRole(request.getRole());
        user.setRole(role);
        user.setEmailVerified(true);
        user.setCreatedAt(Instant.now());
        List<String> assignedOffices = sanitizeAssignedOfficeIds(request.getAssignedOfficeIds(), role);
        user.setAssignedOfficeIds(JsonUtils.writeStringList(assignedOffices));

        User saved = userRepository.save(user);
        return toDto(saved);
    }

    public UserDTO updateUser(String userId, AdminUpdateUserRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User id is required");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getName() != null) {
            String trimmedName = request.getName().trim();
            if (trimmedName.length() < 2) {
                throw new IllegalArgumentException("Name must be at least 2 characters long");
            }
            user.setName(trimmedName);
        }

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            String normalizedEmail = request.getEmail().trim().toLowerCase();
            if (!isValidEmail(normalizedEmail)) {
                throw new IllegalArgumentException("Invalid email address");
            }
            userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> { throw new IllegalStateException("Email already registered"); });
            user.setEmail(normalizedEmail);
        }

        String roleToApply = user.getRole();
        if (request.getRole() != null) {
            roleToApply = normalizeRole(request.getRole());
            user.setRole(roleToApply);
        }

        if (request.getAssignedOfficeIds() != null || !"STAFF".equalsIgnoreCase(roleToApply)) {
            List<String> assigned = sanitizeAssignedOfficeIds(request.getAssignedOfficeIds(), roleToApply);
            user.setAssignedOfficeIds(JsonUtils.writeStringList(assigned));
        }

        User saved = userRepository.save(user);
        return toDto(saved);
    }

    public void deleteUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User id is required");
        }
        userRepository.deleteById(userId);
    }

    private void validateCreateRequest(AdminCreateUserRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (request.getName() == null || request.getName().trim().length() < 2) {
            throw new IllegalArgumentException("Name must be at least 2 characters long");
        }
        if (!isValidEmail(request.getEmail())) {
            throw new IllegalArgumentException("Invalid email address");
        }
        if (!isValidPassword(request.getPassword())) {
            throw new IllegalArgumentException("Password must be at least 8 characters and include upper, lower, number, and special characters");
        }
        if (!ALLOWED_ROLES.contains(normalizeRole(request.getRole()))) {
            throw new IllegalArgumentException("Unsupported role");
        }
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    }

    private boolean isValidPassword(String password) {
        return password != null && password.matches("(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\W).*");
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "STUDENT";
        }
        String normalized = role.trim().toUpperCase();
        return ALLOWED_ROLES.contains(normalized) ? normalized : "STUDENT";
    }

    private List<String> sanitizeAssignedOfficeIds(List<String> officeIds, String role) {
        if (!"STAFF".equalsIgnoreCase(role)) {
            return Collections.emptyList();
        }
        if (officeIds == null) {
            return Collections.emptyList();
        }
        return officeIds.stream()
            .filter(id -> id != null && !id.isBlank())
            .map(String::trim)
            .distinct()
            .collect(Collectors.toList());
    }

    private UserDTO toDto(User user) {
        return new UserDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.isEmailVerified(),
            user.getRole(),
            user.getPoints(),
            JsonUtils.readStringList(user.getAssignedOfficeIds())
        );
    }
}