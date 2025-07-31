package ukf.backend.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService         jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   UserDetailsService userDetailsService) {
        this.jwtService        = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        String jwt = header.substring(7);
        String email = jwtService.extractEmail(jwt);
        if (email == null) {
            chain.doFilter(request, response);
            return;
        }

        var current = SecurityContextHolder.getContext().getAuthentication();
        if (current != null && !(current instanceof AnonymousAuthenticationToken)) {
            chain.doFilter(request, response);
            return;
        }

        var userDetails = userDetailsService.loadUserByUsername(email);

        if (!jwtService.validateToken(jwt, userDetails.getUsername())) {
            log.debug("JWT invalid – {} → {}", email, request.getRequestURI());
            chain.doFilter(request, response);
            return;
        }

        var authToken = new UsernamePasswordAuthenticationToken(
                userDetails,                          // principal
                null,                                 // credentials
                userDetails.getAuthorities());

        authToken.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authToken);

        log.debug("JWT OK  – {} → {}", email, request.getRequestURI());
        chain.doFilter(request, response);
    }
}