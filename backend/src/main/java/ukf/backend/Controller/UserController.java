package ukf.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.Role.RoleRepository;
import ukf.backend.dtos.UpdateUserDTO;


import java.util.List;
import java.util.Optional;
import java.util.Collection;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private RoleRepository roleRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }


    @PutMapping("/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody UpdateUserDTO updateUserDTO) {
        Optional<User> findUser = userRepository.findById(id);
        if (findUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = findUser.get();

        user.setName(updateUserDTO.getName());
        user.setSurname(updateUserDTO.getSurname());
        user.setEmail(updateUserDTO.getEmail());

        if (updateUserDTO.getPassword() != null && !updateUserDTO.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateUserDTO.getPassword()));
        }

        if (updateUserDTO.getRoleIds() != null && !updateUserDTO.getRoleIds().isEmpty()) {
            Collection<Role> roles = roleRepository.findAllById(updateUserDTO.getRoleIds());
            if (roles.size() != updateUserDTO.getRoleIds().size()) {
                return ResponseEntity.badRequest().body("bad role id");
            }
            user.setRoles(roles);
        }

        userRepository.save(user);
        return ResponseEntity.ok("user updated");
    }

    @PatchMapping("/{id}")
    public ResponseEntity<String> patchUser(@PathVariable Long id, @RequestBody UpdateUserDTO updateUserDTO) {
        Optional<User> findUser = userRepository.findById(id);
        if (findUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = findUser.get();

        if (updateUserDTO.getName() != null) {
            user.setName(updateUserDTO.getName());
        }
        if (updateUserDTO.getSurname() != null) {
            user.setSurname(updateUserDTO.getSurname());
        }
        if (updateUserDTO.getEmail() != null) {
            user.setEmail(updateUserDTO.getEmail());
        }
        if (updateUserDTO.getPassword() != null && !updateUserDTO.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateUserDTO.getPassword()));
        }
        if (updateUserDTO.getRoleIds() != null && !updateUserDTO.getRoleIds().isEmpty()) {
            Collection<Role> roles = roleRepository.findAllById(updateUserDTO.getRoleIds());
            if (roles.size() != updateUserDTO.getRoleIds().size()) {
                return ResponseEntity.badRequest().body("bad role id");
            }
            user.setRoles(roles);
        }

        userRepository.save(user);
        return ResponseEntity.ok("user updated");
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<String> updateUserRoles(@PathVariable Long id, @RequestBody List<Long> roleIds) {
        Optional<User> findUser = userRepository.findById(id);
        if (findUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = findUser.get();
        Collection<Role> roles = roleRepository.findAllById(roleIds);
        if (roles.size() != roleIds.size()) {
            return ResponseEntity.badRequest().body("bad id");
        }

        user.setRoles(roles);
        userRepository.save(user);
        return ResponseEntity.ok("roles updated");
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            userRepository.delete(user.get());
            return ResponseEntity.ok("user deleted");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
