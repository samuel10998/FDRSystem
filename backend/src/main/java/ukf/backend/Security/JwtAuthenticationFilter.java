package ukf.backend.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {


    private final JwtService jwtService;


    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String email = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            email = jwtService.extractEmail(jwt);
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            try {
                var userDetails = this.userDetailsService.loadUserByUsername(email); // Now using email to load user

                String roles = jwtService.extractClaim(jwt, claims -> claims.get("roles", String.class));
                String regex = "ROLE_\\w+"; // Matches words starting with ROLE_

                Pattern pattern = Pattern.compile(regex);
                Matcher matcher = pattern.matcher(roles);

                Collection<GrantedAuthority> authorities = new ArrayList<>();
                while (matcher.find()) {
                    authorities.add(new SimpleGrantedAuthority(matcher.group()));
                }

                if (jwtService.validateToken(jwt, userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            } catch (UsernameNotFoundException e) {
                throw new RuntimeException(e);
            }
        }
        chain.doFilter(request, response);
    }
}
