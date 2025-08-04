package ukf.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ukf.backend.Model.AllowedEmailDomain.AllowedEmailDomain;
import ukf.backend.Model.AllowedEmailDomain.AllowedEmailDomainRepository;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.Role.RoleRepository;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

@Component
public class SetupDataLoader implements ApplicationListener<ContextRefreshedEvent> {

    private boolean alreadySetup = false;

    @Autowired private UserRepository               userRepository;
    @Autowired private RoleRepository               roleRepository;
    @Autowired private AllowedEmailDomainRepository allowedEmailDomainRepository;
    @Autowired private PasswordEncoder              passwordEncoder;

    @Override
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) {

        if (alreadySetup) return;

        /* povolené domény */
        createDomainIfNotFound("student.ukf.sk");
        createDomainIfNotFound("gmail.com");

        Role adminRole = createRoleIfNotFound("ROLE_ADMIN");
        createRoleIfNotFound("ROLE_USER");

        createUserIfNotFound(
                "Test",
                "Test",
                "test",
                "test@student.ukf.sk",
                adminRole
        );

        alreadySetup = true;
    }


    @Transactional
    Role createRoleIfNotFound(String name) {
        Role role = roleRepository.findByName(name);
        if (role == null) {
            role = new Role();
            role.setName(name);
            roleRepository.save(role);
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
        }
    }

    @Transactional
    User createUserIfNotFound(String name,
                              String surname,
                              String password,
                              String email,
                              Role role) {

        Optional<User> opt = userRepository.findByEmail(email);

        if (opt.isEmpty()) {
            User user = new User();
            user.setName(name);
            user.setSurname(surname);
            user.setPassword(passwordEncoder.encode(password));
            user.setEmail(email);
            user.setRoles(Collections.singletonList(role));
            user.setAccountVerified(true);

            user.setRegion("Nitriansky kraj");
            user.setProfilePicture("profile_picture_default.jpg");

            userRepository.save(user);
            return user;
        }

        User user = opt.get();
        boolean changed = false;

        if (user.getRegion() == null) {
            user.setRegion("Nitriansky kraj");
            changed = true;
        }
        if (user.getProfilePicture() == null) {
            user.setProfilePicture("profile_picture_default.jpg");
            changed = true;
        }

        if (changed) {
            userRepository.save(user);
        }

        return user;
    }
}
