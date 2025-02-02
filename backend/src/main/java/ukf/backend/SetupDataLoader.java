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
public class SetupDataLoader implements
        ApplicationListener<ContextRefreshedEvent> {

    boolean alreadySetup = false;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AllowedEmailDomainRepository allowedEmailDomainRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) {

        if (alreadySetup)
            return;

        createDomainIfNotFound("student.ukf.sk");
        createDomainIfNotFound("stu.sk");

        createRoleIfNotFound("ROLE_ADMIN");
        createRoleIfNotFound("ROLE_USER");

        Role adminRole = roleRepository.findByName("ROLE_ADMIN");

        createUserIfNotFound("Test", "Test", "test", "test@student.ukf.sk", adminRole);

        alreadySetup = true;
    }

    @Transactional
    void createRoleIfNotFound(String name) {

        Role role = roleRepository.findByName(name);
        if (role == null) {
            role = new Role();
            role.setName(name);
            roleRepository.save(role);
        }
    }

    @Transactional
    void createDomainIfNotFound(String name) {

        Optional<AllowedEmailDomain> domains = allowedEmailDomainRepository.findByDomain(name);
        if (domains.isEmpty()) {
            AllowedEmailDomain allowedEmailDomain = new AllowedEmailDomain();
            allowedEmailDomain.setDomain(name);
            allowedEmailDomainRepository.save(allowedEmailDomain);
        }
    }

    @Transactional
    void createUserIfNotFound(String name, String surname, String password, String email, Role role) {

        Optional<User> users = userRepository.findByEmail(email);
        if (users.isEmpty()){
            User user = new User();
            user.setName(name);
            user.setSurname(surname);
            user.setPassword(passwordEncoder.encode(password));
            user.setEmail(email);
            user.setRoles(Collections.singletonList(role));
            userRepository.save(user);
        }
    }
}