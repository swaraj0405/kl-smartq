package com.klsmartq.dto;

public class AuthResponse {
    private String token;
    private Object user;
    private long expiresIn;

    public AuthResponse() {}
    public AuthResponse(String token, Object user, long expiresIn) {
        this.token = token; this.user = user; this.expiresIn = expiresIn;
    }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Object getUser() { return user; }
    public void setUser(Object user) { this.user = user; }
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
}
