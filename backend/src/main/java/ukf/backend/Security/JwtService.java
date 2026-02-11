package ukf.backend.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.*;
import java.util.function.Function;

@Component
public class JwtService {

    private final Key signingKey;

    private final long expSeconds;          // napr. 1800 = 30 min
    private final String issuer;            // voliteľné
    private final String audience;          // voliteľné

    public JwtService(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.exp-seconds:1800}") long expSeconds,
            @Value("${jwt.issuer:}") String issuer,
            @Value("${jwt.audience:}") String audience
    ) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("jwt.secret is missing or blank");
        }

        // Väčšinou máš secret z: openssl rand -base64 48  -> to je BASE64
        // Takže ho dekódujeme a spravíme HMAC key.
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secretKey.trim());
        } catch (IllegalArgumentException ex) {
            // fallback: ak by niekto dal obyčajný string (nie base64)
            keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);

        if (expSeconds < 60) {
            throw new IllegalStateException("jwt.exp-seconds must be >= 60");
        }
        this.expSeconds = expSeconds;

        this.issuer = issuer != null ? issuer.trim() : "";
        this.audience = audience != null ? audience.trim() : "";
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) throws JwtException {
        var parser = Jwts.parserBuilder()
                .setSigningKey(signingKey);

        // issuer/audience validujeme len ak sú nastavené
        if (!issuer.isBlank()) parser.requireIssuer(issuer);
        if (!audience.isBlank()) parser.requireAudience(audience);

        return parser
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * roles = zoznam stringov, napr. ["ROLE_USER","ROLE_ADMIN"]
     */
    public String generateToken(String email, List<String> roles, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles != null ? roles : List.of());
        claims.put("userId", userId);
        return createToken(claims, email);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        long nowMs = System.currentTimeMillis();
        Date issuedAt = new Date(nowMs);
        Date exp = new Date(nowMs + (expSeconds * 1000L));

        var builder = Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(issuedAt)
                .setExpiration(exp);

        // voliteľné: issuer/audience
        if (!issuer.isBlank()) builder.setIssuer(issuer);
        if (!audience.isBlank()) builder.setAudience(audience);

        return builder
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validácia: podpis + exp + subject + (issuer/aud ak sú nastavené)
     */
    public Boolean validateToken(String token, String email) {
        try {
            final String extractedEmail = extractEmail(token);
            return extractedEmail != null
                    && extractedEmail.equals(email)
                    && !isTokenExpired(token);
        } catch (JwtException ex) {
            return false;
        }
    }
}
