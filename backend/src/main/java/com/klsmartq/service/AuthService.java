package com.klsmartq.service;

import com.klsmartq.dto.AuthResponse;
import com.klsmartq.dto.UserDTO;
import com.klsmartq.entity.TempRegistration;
import com.klsmartq.entity.User;
import com.klsmartq.repository.TempRegistrationRepository;
import com.klsmartq.repository.UserRepository;
import com.klsmartq.util.JsonUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TempRegistrationRepository tempRepo;
    private final EmailService emailService;

    @Value("${jwt.secret:dev-secret-kl-smartq}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600}")
    private long jwtExpiration;

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, TempRegistrationRepository tempRepo, EmailService emailService, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.tempRepo = tempRepo;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    private boolean validEmail(String email) {
        return email != null && email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    }

    private boolean validPassword(String pw) {
        return pw != null && pw.matches("(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\W).*");
    }

    public void startRegistration(String name, String email, String password) {
        if (!validEmail(email)) throw new IllegalArgumentException("Invalid email");
        if (!validPassword(password)) throw new IllegalArgumentException("Password complexity") ;
        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) throw new IllegalStateException("Email already registered");

        String hashed = passwordEncoder.encode(password);
        String code = RandomStringUtils.randomNumeric(6);
        Instant expires = Instant.now().plus(10, ChronoUnit.MINUTES);

        TempRegistration temp = new TempRegistration();
        temp.setEmail(email.toLowerCase()); temp.setName(name); temp.setPasswordHash(hashed);
        temp.setCode(code); temp.setExpiresAt(expires); temp.setVerified(false);
        tempRepo.save(temp);

        // Send email using SendGrid HTTP API (works on Render)
        emailService.sendVerificationCode(email, code);
    }    public void verifyCode(String email, String code) {
        TempRegistration temp = tempRepo.findById(email.toLowerCase()).orElseThrow(() -> new IllegalStateException("No pending registration"));
        if (temp.isVerified()) return;
        if (!temp.getCode().equals(code)) throw new IllegalArgumentException("Invalid code");
        if (temp.getExpiresAt().isBefore(Instant.now())) throw new IllegalArgumentException("Code expired");
        temp.setVerified(true); tempRepo.save(temp);
    }

    public AuthResponse completeRegistration(String email) {
        TempRegistration temp = tempRepo.findById(email.toLowerCase()).orElseThrow(() -> new IllegalStateException("No pending registration"));
        if (!temp.isVerified()) throw new IllegalStateException("Email not verified");
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(temp.getName()); user.setEmail(temp.getEmail()); user.setPasswordHash(temp.getPasswordHash());
        user.setEmailVerified(true);
        user.setRole("STUDENT"); // Auto-assign STUDENT role for self-registration
        userRepository.save(user);

        tempRepo.deleteById(email.toLowerCase());

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
        return new AuthResponse(token, dto, jwtExpiration);
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
    if (!passwordEncoder.matches(password, user.getPasswordHash())) throw new IllegalArgumentException("Invalid credentials");
        if (!user.isEmailVerified()) throw new IllegalStateException("Email not verified");
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
        return new AuthResponse(token, dto, jwtExpiration);
    }
}
