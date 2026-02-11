package ukf.backend;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ukf.backend.Model.AllowedEmailDomain.AllowedEmailDomain;
import ukf.backend.Model.AllowedEmailDomain.AllowedEmailDomainRepository;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.Role.RoleRepository;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;

import java.util.Collections;
import java.util.Optional;

@Component
@Slf4j
public class SetupDataLoader implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AllowedEmailDomainRepository allowedEmailDomainRepository;
    private final PasswordEncoder passwordEncoder;

    // configtree -> /run/secrets/admin_email etc. (content may include newline => trim)
    @Value("${admin_email:}")
    private String adminEmail;

    @Value("${admin_password:}")
    private String adminPassword;

    @Value("${admin_name:Admin}")
    private String adminName;

    @Value("${admin_surname:User}")
    private String adminSurname;

    // keep it as String to safely trim (e.g. "true\n")
    @Value("${admin_seed_force_reset:false}")
    private String adminSeedForceResetRaw;

    public SetupDataLoader(UserRepository userRepository,
                           RoleRepository roleRepository,
                           AllowedEmailDomainRepository allowedEmailDomainRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.allowedEmailDomainRepository = allowedEmailDomainRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        // Allowed domains
        createDomainIfNotFound("student.ukf.sk");
        createDomainIfNotFound("gmail.com");

        Role adminRole = createRoleIfNotFound("ROLE_ADMIN");
        createRoleIfNotFound("ROLE_USER");

        String email = (adminEmail == null) ? "" : adminEmail.trim();
        String pass  = (adminPassword == null) ? "" : adminPassword.trim();
        boolean forceReset = parseBoolean(adminSeedForceResetRaw);

        if (email.isBlank() || pass.isBlank()) {
            log.warn("Admin seed SKIPPED: admin_email/admin_password not set (or blank).");
            return;
        }

        Optional<User> existingOpt = userRepository.findByEmail(email);

        if (existingOpt.isEmpty()) {
            User user = new User();
            user.setName((adminName == null || adminName.isBlank()) ? "Admin" : adminName.trim());
            user.setSurname((adminSurname == null || adminSurname.isBlank()) ? "User" : adminSurname.trim());
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(pass));
            user.setRoles(Collections.singletonList(adminRole));
            user.setAccountVerified(true);

            user.setRegion("Nitriansky kraj");
            user.setProfilePicture("profile_picture_default.jpg");

            userRepository.save(user);
            log.info("Admin seed CREATED: {}", email);
            return;
        }

        if (forceReset) {
            User existing = existingOpt.get();
            existing.setPassword(passwordEncoder.encode(pass));
            userRepository.save(existing);
            log.warn("Admin seed UPDATED (password reset): {}", email);
        } else {
            log.info("Admin seed EXISTS (no changes): {}", email);
        }
    }

    private boolean parseBoolean(String raw) {
        if (raw == null) return false;
        String v = raw.trim().toLowerCase();
        return v.equals("true") || v.equals("1") || v.equals("yes") || v.equals("y");
    }

    @Transactional
    Role createRoleIfNotFound(String name) {
        Role role = roleRepository.findByName(name);
        if (role == null) {
            role = new Role();
            role.setName(name);
            roleRepository.save(role);
            log.info("Role created: {}", name);
        }
        return role;
    }

    @Transactional
    void createDomainIfNotFound(String name) {
        Optional<AllowedEmailDomain> domains = allowedEmailDomainRepository.findByDomain(name);
        if (domains.isEmpty()) {
            AllowedEmailDomain allowed = new AllowedEmailDomain();
            allowed.setDomain(name);
            allowedEmailDomainRepository.save(allowed);
            log.info("Allowed domain added: {}", name);
        }
    }
}
