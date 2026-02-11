package ukf.backend.Controller;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
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
import ukf.backend.Model.AuditLog.AuditLogService;
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

    @Autowired private AuditLogService auditLogService;

    @PostMapping(value = "/api/register", consumes = "application/json")
    public ResponseEntity<String> createUser(@RequestBody User user, HttpServletRequest request) throws MessagingException {

        if (user.getEmail() == null || user.getPassword() == null ||
                user.getName() == null  || user.getSurname() == null ||
                user.getRegion() == null || user.getRegion().isBlank()) {

            auditLogService.log(null, "REGISTER_FAIL", null, request, "missing_fields");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Name, surname, email, password a region sú povinné.");
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            auditLogService.log(null, "REGISTER_FAIL", null, request, "email_exists=" + user.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("A user with that email address already exists.");
        }

        String domain = user.getEmail().substring(user.getEmail().indexOf("@") + 1);
        if (allowedEmailDomainRepository.findByDomain(domain).isEmpty()) {
            auditLogService.log(null, "REGISTER_FAIL", null, request, "domain_not_allowed=" + domain);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email domain not allowed.");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Collections.singletonList(roleRepository.findByName("ROLE_USER")));
        user.setProfilePicture(DEFAULT_AVATAR);
        userRepository.save(user);

        auditLogService.log(null, "REGISTER_SUCCESS", user.getId(), request, "email=" + user.getEmail());

        userService.sendRegistrationConfirmationEmail(user);
        return ResponseEntity.ok("User registered successfully.");
    }

    @PostMapping(value = "/api/login", consumes = "application/json")
    public ResponseEntity<Map<String, Object>> loginUser(@RequestBody User user, HttpServletRequest request) {

        if (user.getEmail() == null || user.getPassword() == null) {
            auditLogService.log(null, "LOGIN_FAIL", null, request, "missing_email_or_password");
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
                auditLogService.log(authentication, "LOGIN_FAIL", authenticatedUser.getId(), request, "account_not_verified");
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Account is not verified."));
            }

            Collection<Role> roles = authenticatedUser.getRoles();
            String jwt = jwtService.generateToken(
                    authenticatedUser.getEmail(),
                    roles.toString(),
                    authenticatedUser.getId()
            );

            auditLogService.log(authentication, "LOGIN_SUCCESS", authenticatedUser.getId(), request, null);

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
            auditLogService.log(null, "LOGIN_FAIL", null, request, "bad_credentials email=" + user.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    @GetMapping("/confirm-email")
    public ResponseEntity<String> confirmEmail(@RequestParam("token") String token, HttpServletRequest request) {
        try {
            boolean ok = userService.verifyUser(token);
            if (ok) {
                auditLogService.log(null, "EMAIL_CONFIRM_SUCCESS", null, request, null);
                return ResponseEntity.ok("✅ Email potvrdený. Teraz sa môžeš prihlásiť.");
            }
            auditLogService.log(null, "EMAIL_CONFIRM_FAIL", null, request, "invalid_or_expired");
            return ResponseEntity.ok("⚠️ Token je neplatný / expirovaný alebo účet už bol potvrdený.");

        } catch (InvalidTokenException ex) {
            auditLogService.log(null, "EMAIL_CONFIRM_FAIL", null, request, "invalid_token");
            return ResponseEntity.ok("⚠️ Token je neplatný / expirovaný alebo účet už bol potvrdený.");
        } catch (Exception ex) {
            auditLogService.log(null, "EMAIL_CONFIRM_ERROR", null, request, ex.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Nastala chyba pri potvrdení emailu.");
        }
    }
}
