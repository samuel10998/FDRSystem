package ukf.backend.Model.AuditLog;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import ukf.backend.Model.User.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})");

    // lightweight secret patterns for generic details sanitizer
    private static final Pattern JWT_PATTERN =
            Pattern.compile("\\beyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\b");

    private static final Pattern BEARER_PATTERN =
            Pattern.compile("(?i)bearer\\s+[A-Za-z0-9._-]{20,}");

    private static final Pattern DEVICE_KEY_PATTERN =
            Pattern.compile("(?i)(deviceKeyPlain\\s*=\\s*)([^,\\s]+)");

    private static final int DETAILS_MAX = 1024;

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void log(Authentication auth,
                    String action,
                    Long targetId,
                    HttpServletRequest request,
                    String details) {

        Long actorId = resolveActorId(auth);
        persist(actorId, action, targetId, request, details);
    }

    /**
     * Use when Authentication is not available, but actorId is known.
     */
    public void logWithActorId(Long actorId,
                               String action,
                               Long targetId,
                               HttpServletRequest request,
                               String details) {

        persist(actorId, action, targetId, request, details);
    }

    /**
     * Convenience helper for controllers.
     */
    public Long findUserIdByEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return userRepository.findByEmail(email.trim())
                .map(u -> u.getId())
                .orElse(null);
    }

    /**
     * Stable, non-reversible hash prefix for audit trails.
     * Returns null when email is null/blank.
     */
    public String emailHash(String email) {
        if (email == null || email.isBlank()) return null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(email.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 16);
        } catch (Exception ex) {
            // very unlikely, but keep audit flow resilient
            return "hash_error";
        }
    }

    private void persist(Long actorId,
                         String action,
                         Long targetId,
                         HttpServletRequest request,
                         String details) {

        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setTargetId(targetId);
        log.setDetails(sanitizeDetails(details));
        log.setActorId(actorId);

        if (request != null) {
            log.setIp(extractIp(request));
            log.setUserAgent(Optional.ofNullable(request.getHeader("User-Agent")).orElse(null));
        }

        auditLogRepository.save(log);
    }

    private String sanitizeDetails(String details) {
        if (details == null) return null;

        String s = details;

        // replace raw emails -> emailHash:<hash>
        Matcher m = EMAIL_PATTERN.matcher(s);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String raw = m.group(1);
            String repl = "emailHash:" + Optional.ofNullable(emailHash(raw)).orElse("null");
            m.appendReplacement(sb, Matcher.quoteReplacement(repl));
        }
        m.appendTail(sb);
        s = sb.toString();

        // redact common secrets
        s = JWT_PATTERN.matcher(s).replaceAll("[REDACTED_JWT]");
        s = BEARER_PATTERN.matcher(s).replaceAll("Bearer [REDACTED]");
        s = DEVICE_KEY_PATTERN.matcher(s).replaceAll("$1[REDACTED]");

        // DB column protection
        if (s.length() > DETAILS_MAX) {
            s = s.substring(0, DETAILS_MAX);
        }
        return s;
    }

    private Long resolveActorId(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;

        // auth.getName() == email in your setup
        return userRepository.findByEmail(auth.getName())
                .map(u -> u.getId())
                .orElse(null);
    }

    private String extractIp(HttpServletRequest request) {
        // Local dev: remoteAddr is fine.
        // If later behind reverse proxy, you can switch to X-Forwarded-For parsing.
        return request.getRemoteAddr();
    }
}
