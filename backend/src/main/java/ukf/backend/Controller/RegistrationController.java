package ukf.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import ukf.backend.Model.AllowedEmailDomain.AllowedEmailDomainRepository;
import ukf.backend.Model.Role.RoleRepository;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;

import java.util.Arrays;
import java.util.Collections;

@RestController
public class RegistrationController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AllowedEmailDomainRepository allowedEmailDomainRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping(value = "/api/register", consumes = "application/json")
    public ResponseEntity<String> createUser(@RequestBody User user){

        if (userRepository.findByEmail(user.getEmail()).isPresent()){
            return new ResponseEntity<>("A user with that email address already exists.",HttpStatus.BAD_REQUEST);
        }
        if (allowedEmailDomainRepository.findByDomain(user.getEmail().substring(user.getEmail().indexOf("@") + 1)).isEmpty()){
            return new ResponseEntity<>("Email domain not allowed.",HttpStatus.BAD_REQUEST);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Collections.singletonList(roleRepository.findByName("ROLE_USER")));
        userRepository.save(user);
        return new ResponseEntity<>("User registered successfully." ,HttpStatus.OK);
    }

}