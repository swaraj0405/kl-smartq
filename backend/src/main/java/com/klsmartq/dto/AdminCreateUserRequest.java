package com.klsmartq.dto;

public class AdminCreateUserRequest {
    private String name;
    private String email;
    private String password;
    private String role;
    private java.util.List<String> assignedOfficeIds;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public java.util.List<String> getAssignedOfficeIds() {
        return assignedOfficeIds;
    }

    public void setAssignedOfficeIds(java.util.List<String> assignedOfficeIds) {
        this.assignedOfficeIds = assignedOfficeIds;
    }
}