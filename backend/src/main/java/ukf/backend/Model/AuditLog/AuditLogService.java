package ukf.backend.Model.AuditLog;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import ukf.backend.Model.User.UserRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void log(Authentication auth,
                    String action,
                    Long targetId,
                    HttpServletRequest request,
                    String details) {

        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setTargetId(targetId);
        log.setDetails(details);

        // actorId from auth email (if available)
        Long actorId = resolveActorId(auth);
        log.setActorId(actorId);

        if (request != null) {
            log.setIp(extractIp(request));
            log.setUserAgent(Optional.ofNullable(request.getHeader("User-Agent")).orElse(null));
        }

        auditLogRepository.save(log);
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
