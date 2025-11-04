package com.klsmartq.dto;

import java.util.List;

public class AdminUpdateUserRequest {
    private String name;
    private String email;
    private String role;
    private List<String> assignedOfficeIds;

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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getAssignedOfficeIds() {
        return assignedOfficeIds;
    }

    public void setAssignedOfficeIds(List<String> assignedOfficeIds) {
        this.assignedOfficeIds = assignedOfficeIds;
    }
}
