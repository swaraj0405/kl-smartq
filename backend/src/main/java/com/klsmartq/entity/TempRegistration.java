package com.klsmartq.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "temp_registrations")
public class TempRegistration {
    @Id
    @Column(length = 255)
    private String email;

    private String name;

    @Column(name = "password_hash")
    private String passwordHash;

    private String code;

    @Column(name = "expires_at")
    private Instant expiresAt;

    private boolean verified = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    // getters/setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
