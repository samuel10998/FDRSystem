package ukf.backend.Controller;

import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import ukf.backend.Exception.InvalidTokenException;
import ukf.backend.Model.AllowedEmailDomain.AllowedEmailDomainRepository;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.Role.RoleRepository;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;
import ukf.backend.Model.User.UserService;
import ukf.backend.Security.JwtService;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@RestController
public class RegistrationController {

    private static final String DEFAULT_AVATAR = "profile_picture_default.jpg";

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private AllowedEmailDomainRepository allowedEmailDomainRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtService jwtService;
    @Autowired private UserService userService;

    @PostMapping(value = "/api/register", consumes = "application/json")
    public ResponseEntity<String> createUser(@RequestBody User user) throws MessagingException {

        if (user.getEmail() == null || user.getPassword() == null ||
                user.getName() == null  || user.getSurname() == null ||
                user.getRegion() == null || user.getRegion().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Name, surname, email, password a region sú povinné.");
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("A user with that email address already exists.");
        }

        String domain = user.getEmail().substring(user.getEmail().indexOf("@") + 1);
        if (allowedEmailDomainRepository.findByDomain(domain).isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email domain not allowed.");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Collections.singletonList(roleRepository.findByName("ROLE_USER")));
        user.setProfilePicture(DEFAULT_AVATAR);
        userRepository.save(user);

        userService.sendRegistrationConfirmationEmail(user);
        return ResponseEntity.ok("User registered successfully.");
    }

    @PostMapping(value = "/api/login", consumes = "application/json")
    public ResponseEntity<Map<String, Object>> loginUser(@RequestBody User user) {

        if (user.getEmail() == null || user.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email or password must not be null"));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User authenticatedUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            if (!authenticatedUser.isAccountVerified()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Account is not verified."));
            }

            Collection<Role> roles = authenticatedUser.getRoles();
            String jwt = jwtService.generateToken(
                    authenticatedUser.getEmail(),
                    roles.toString(),
                    authenticatedUser.getId()
            );

            Map<String, Object> response = Map.of(
                    "token", jwt,
                    "user", Map.of(
                            "id", authenticatedUser.getId(),
                            "name", authenticatedUser.getName(),
                            "surname", authenticatedUser.getSurname(),
                            "roles", roles
                    )
            );
            return ResponseEntity.ok(response);

        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    @GetMapping("/confirm-email")
    public ResponseEntity<String> confirmEmail(@RequestParam("token") String token) {
        try {
            boolean ok = userService.verifyUser(token);
            if (ok) {
                return ResponseEntity.ok("✅ Email potvrdený. Teraz sa môžeš prihlásiť.");
            }
            return ResponseEntity.ok("⚠️ Token je neplatný / expirovaný alebo účet už bol potvrdený.");

        } catch (InvalidTokenException ex) {
            // toto ti predtým robilo 500
            return ResponseEntity.ok("⚠️ Token je neplatný / expirovaný alebo účet už bol potvrdený.");
        } catch (Exception ex) {
            // aby sa už nikdy nezobrazila Whitelabel 500
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Nastala chyba pri potvrdení emailu.");
        }
    }
}
