package ukf.backend.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserService appUserService;
    private final JwtService jwtService;

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
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        // Allow public access to these endpoints
                        .requestMatchers("/api/login", "/api/register", "/confirm-email").permitAll()

                        // Protected endpoints requiring authentication/authorization
                        .requestMatchers("/home").authenticated()
                        .requestMatchers("/manage-users").hasRole("ADMIN")
                        .requestMatchers("/my-flights").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/upload-files").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasAnyRole("ADMIN", "HOST", "USER")
                        .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAnyRole("ADMIN", "HOST", "USER")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/**").hasAnyRole("ADMIN", "HOST", "USER")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // Allow frontend origin
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH")); // Allow these HTTP methods
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type")); // Allow these headers
        configuration.setAllowCredentials(true); // Allow cookies/credentials

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
