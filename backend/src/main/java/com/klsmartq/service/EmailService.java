package com.klsmartq.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {

    @Value("${sendgrid.api-key:#{null}}")
    private String sendgridApiKey;

    @Value("${sendgrid.from-email:no-reply@kl-smartq.local}")
    private String fromEmail;

    @Value("${sendgrid.from-name:KL SmartQ}")
    private String fromName;

    public void sendVerificationCode(String toEmail, String code) {
        // If SendGrid API key is not set, fall back to console logging (for local development)
        if (sendgridApiKey == null || sendgridApiKey.trim().isEmpty()) {
            System.out.println("════════════════════════════════════════");
            System.out.println("📧 EMAIL (Development Mode - No API Key)");
            System.out.println("To: " + toEmail);
            System.out.println("Subject: KL SmartQ - Verification Code");
            System.out.println("────────────────────────────────────────");
            System.out.println("Your verification code is: " + code);
            System.out.println("This code will expire in 10 minutes.");
            System.out.println("════════════════════════════════════════");
            return;
        }

        // Use SendGrid HTTP API (works on Render, bypasses SMTP port blocks)
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(toEmail);
        String subject = "KL SmartQ - Verification Code";
        Content content = new Content("text/plain", 
            "Your verification code is: " + code + "\n\n" +
            "This code will expire in 10 minutes.\n\n" +
            "If you didn't request this code, please ignore this email.");

        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendgridApiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✓ Verification code sent to " + toEmail + " via SendGrid HTTP API");
            } else {
                System.err.println("✗ SendGrid API error: " + response.getStatusCode());
                System.err.println("Response body: " + response.getBody());
                System.err.println("Response headers: " + response.getHeaders());
                throw new IllegalStateException("SendGrid API error " + response.getStatusCode() + ": " + response.getBody());
            }
        } catch (IOException ex) {
            System.err.println("✗ Failed to send email to " + toEmail + ": " + ex.getMessage());
            throw new IllegalStateException("Failed to send verification email: " + ex.getMessage());
        }
    }
}
