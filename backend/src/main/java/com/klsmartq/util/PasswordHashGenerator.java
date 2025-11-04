package com.klsmartq.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Utility to generate BCrypt password hashes for manual database insertion
 */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Generate hash for admin password: Swaraj@0405
        String adminPassword = "Swaraj@0405";
        String adminHash = encoder.encode(adminPassword);
        
        System.out.println("=".repeat(80));
        System.out.println("BCrypt Password Hash Generator");
        System.out.println("=".repeat(80));
        System.out.println();
        System.out.println("Password: " + adminPassword);
        System.out.println("BCrypt Hash: " + adminHash);
        System.out.println();
        System.out.println("SQL to insert admin user:");
        System.out.println("-".repeat(80));
        System.out.println();
        System.out.println("DELETE FROM users WHERE email = 'paramjitbaral44@gmail.com';");
        System.out.println();
        System.out.println("INSERT INTO users (id, name, email, password, role, created_at, updated_at)");
        System.out.println("VALUES (");
        System.out.println("    UUID(),");
        System.out.println("    'Admin User',");
        System.out.println("    'paramjitbaral44@gmail.com',");
        System.out.println("    '" + adminHash + "',");
        System.out.println("    'Admin',");
        System.out.println("    NOW(),");
        System.out.println("    NOW()");
        System.out.println(");");
        System.out.println();
        System.out.println("=".repeat(80));
    }
}
