package ukf.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.Role.RoleRepository;
import ukf.backend.Model.flight.Flight;
import ukf.backend.Repository.flight.FlightRepository;
import ukf.backend.Security.JwtService;
import ukf.backend.dtos.UpdateUserDTO;
import ukf.backend.dtos.UserAnalyticsDTO;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtService jwtService;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractEmail(token);
        Optional<User> user = userRepository.findByEmail(email);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<UserAnalyticsDTO> getUserAnalytics(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) return ResponseEntity.notFound().build();

        List<Flight> flights = flightRepository.findAllByUserIdOrderByStartTimeDesc(id);

        int totalFlights = flights.size();
        long totalRecords = flights.stream().mapToLong(f -> f.getRecords().size()).sum();
        long totalDurationSeconds = flights.stream()
                .mapToLong(f -> {
                    if (f.getStartTime() != null && f.getEndTime() != null) {
                        return java.time.Duration.between(f.getStartTime(), f.getEndTime()).getSeconds();
                    } else {
                        return 0;
                    }
                }).sum();

        double totalDistanceKm = flights.stream()
                .mapToDouble(f -> f.getDistanceKm() != null ? f.getDistanceKm() : 0.0)
                .sum();

        long averageDurationSeconds = totalFlights > 0 ? totalDurationSeconds / totalFlights : 0;

        UserAnalyticsDTO analytics = new UserAnalyticsDTO(
                totalFlights,
                totalRecords,
                averageDurationSeconds,
                totalDistanceKm
        );

        return ResponseEntity.ok(analytics);
    }


    @PutMapping("/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody UpdateUserDTO updateUserDTO) {
        Optional<User> findUser = userRepository.findById(id);
        if (findUser.isEmpty()) return ResponseEntity.notFound().build();

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
        if (findUser.isEmpty()) return ResponseEntity.notFound().build();

        User user = findUser.get();

        if (updateUserDTO.getName() != null) user.setName(updateUserDTO.getName());
        if (updateUserDTO.getSurname() != null) user.setSurname(updateUserDTO.getSurname());
        if (updateUserDTO.getEmail() != null) user.setEmail(updateUserDTO.getEmail());
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
        if (findUser.isEmpty()) return ResponseEntity.notFound().build();

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
