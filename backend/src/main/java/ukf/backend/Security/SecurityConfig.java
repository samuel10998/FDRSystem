package ukf.backend.Security;

import jakarta.servlet.DispatcherType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import ukf.backend.Model.User.UserService;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserService appUserService;
    private final JwtService jwtService;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String corsAllowedOrigins;

    public SecurityConfig(UserService appUserService, JwtService jwtService) {
        this.appUserService = appUserService;
        this.jwtService = jwtService;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtService, userDetailsService());
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return appUserService;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(appUserService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth

                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/error", "/error/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()

                        .requestMatchers("/api/login", "/api/register").permitAll()
                        .requestMatchers("/favicon.ico").permitAll()
                        .requestMatchers("/.well-known/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/confirm-email").permitAll()
                        .requestMatchers("/confirm-email", "/confirm-email/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/users/*/avatar").permitAll()

                        // ✅ NEW: current user info
                        .requestMatchers(HttpMethod.GET, "/api/me")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // ----------- DEVICES (USER/ADMIN) -----------
                        .requestMatchers(HttpMethod.GET, "/api/devices/my")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/devices/pair")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // ----------- ADMIN DEVICES -----------
                        .requestMatchers(HttpMethod.POST, "/api/admin/devices")
                        .hasAuthority("ROLE_ADMIN")

                        // ✅ NEW: list users who need devices
                        .requestMatchers(HttpMethod.GET, "/api/admin/users/device-requests")
                        .hasAuthority("ROLE_ADMIN")

                        // ----------- CLOUD SYNC -----------
                        .requestMatchers(HttpMethod.POST, "/api/cloud/sync")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // ----------- FLIGHTS -----------
                        .requestMatchers(HttpMethod.POST, "/api/flights")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // ----------- AVATAR UPLOAD -----------
                        .requestMatchers(HttpMethod.POST, "/api/users/*/avatar")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // ----------- FRONTEND ROUTES (if any) -----------
                        .requestMatchers("/home").authenticated()
                        .requestMatchers("/manage-users").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/my-flights", "/upload-files").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // ----------- USERS API -----------
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users/**").hasAuthority("ROLE_ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(origins);
        cfg.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","PATCH","HEAD","OPTIONS"));
        cfg.setAllowedHeaders(Arrays.asList("Authorization","Content-Type"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}