package com.klsmartq.controller;

import com.klsmartq.dto.AdminCreateUserRequest;
import com.klsmartq.dto.AdminUpdateUserRequest;
import com.klsmartq.dto.UserDTO;
import com.klsmartq.entity.User;
import com.klsmartq.service.AdminUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173", "http://localhost:8082"})
public class AdminController {

    private final AdminUserService adminUserService;

    public AdminController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> listUsers(@AuthenticationPrincipal User principal) {
        ensureAdmin(principal);
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<UserDTO> createUser(@AuthenticationPrincipal User principal, @RequestBody AdminCreateUserRequest request) {
        ensureAdmin(principal);
        UserDTO created = adminUserService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserDTO> updateUser(@AuthenticationPrincipal User principal, @PathVariable String userId, @RequestBody AdminUpdateUserRequest request) {
        ensureAdmin(principal);
        UserDTO updated = adminUserService.updateUser(userId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal User principal, @PathVariable String userId) {
        ensureAdmin(principal);
        adminUserService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    private void ensureAdmin(User principal) {
        if (principal == null || principal.getRole() == null || !"ADMIN".equalsIgnoreCase(principal.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}