package com.klsmartq.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
    @Id
    @Column(length = 36)
    private String id;

    private String name;

    @Column(unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "is_email_verified")
    private boolean isEmailVerified = false;

    @Column(nullable = false, length = 20)
    private String role = "STUDENT"; // Default role is STUDENT

    private int points = 0;

    @Column(columnDefinition = "json", nullable = true)
    private String badges;

    @Column(name = "assigned_office_ids", columnDefinition = "json")
    private String assignedOfficeIds;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public boolean isEmailVerified() { return isEmailVerified; }
    public void setEmailVerified(boolean emailVerified) { isEmailVerified = emailVerified; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
    public String getBadges() { return badges; }
    public void setBadges(String badges) { this.badges = badges; }
    public String getAssignedOfficeIds() { return assignedOfficeIds; }
    public void setAssignedOfficeIds(String assignedOfficeIds) { this.assignedOfficeIds = assignedOfficeIds; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}