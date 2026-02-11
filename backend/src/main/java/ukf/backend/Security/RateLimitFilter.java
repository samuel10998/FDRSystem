package ukf.backend.Security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    // configurable limits
    @Value("${ratelimit.login.capacity:10}")
    private int loginCapacity;

    @Value("${ratelimit.login.window-seconds:60}")
    private long loginWindowSeconds;

    @Value("${ratelimit.register.capacity:5}")
    private int registerCapacity;

    @Value("${ratelimit.register.window-seconds:300}")
    private long registerWindowSeconds;

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // apply only to these public endpoints + only POST
        if (!"POST".equalsIgnoreCase(request.getMethod())) return true;

        String path = request.getRequestURI();
        return !(path.equals("/api/login") || path.equals("/api/register"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String ip = resolveClientIp(request);
        String key = ip; // could change for ip or email later

        Bucket bucket;
        String path = request.getRequestURI();

        if (path.equals("/api/login")) {
            bucket = loginBuckets.computeIfAbsent(key, k -> newBucket(loginCapacity, loginWindowSeconds));
        } else { // /api/register
            bucket = registerBuckets.computeIfAbsent(key, k -> newBucket(registerCapacity, registerWindowSeconds));
        }

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            // optional: expose remaining tokens to client (debug friendly)
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
            return;
        }

        long waitForSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(waitForSeconds));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        String body = "{\"message\":\"Too many requests. Please try again later.\"}";
        response.getWriter().write(body);

        log.warn("Rate limit HIT for {} on {} (retry-after={}s)", ip, path, waitForSeconds);
    }

    private Bucket newBucket(int capacity, long windowSeconds) {
        Refill refill = Refill.intervally(capacity, Duration.ofSeconds(windowSeconds));
        Bandwidth limit = Bandwidth.classic(capacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        // if later behind reverse proxy, this header is standard
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // first IP in the list is the client
            String first = xff.split(",")[0].trim();
            if (!first.isBlank()) return first;
        }
        String ip = request.getRemoteAddr();
        return (ip != null) ? ip : "unknown";
    }
}
