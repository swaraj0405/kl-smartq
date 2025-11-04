package com.klsmartq.dto;

public class UserDTO {
    private String id;
    private String name;
    private String email;
    private boolean isEmailVerified;
    private String role;
    private int points;
    private java.util.List<String> assignedOfficeIds;

    public UserDTO() {}
    public UserDTO(String id, String name, String email, boolean isEmailVerified, String role, int points, java.util.List<String> assignedOfficeIds) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.isEmailVerified = isEmailVerified;
        this.role = role;
        this.points = points;
        this.assignedOfficeIds = assignedOfficeIds;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean getIsEmailVerified() { return isEmailVerified; }
    public void setIsEmailVerified(boolean v) { this.isEmailVerified = v; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
    public java.util.List<String> getAssignedOfficeIds() { return assignedOfficeIds; }
    public void setAssignedOfficeIds(java.util.List<String> assignedOfficeIds) { this.assignedOfficeIds = assignedOfficeIds; }
}