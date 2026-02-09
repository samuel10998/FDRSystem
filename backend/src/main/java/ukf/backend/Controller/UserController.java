package ukf.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.Role.RoleRepository;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;
import ukf.backend.Repository.flight.FlightRepository;
import ukf.backend.Security.JwtService;
import ukf.backend.dtos.UpdateUserDTO;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Path AVATAR_DIR = Paths.get("uploads", "avatars");

    @Autowired private UserRepository   userRepository;
    @Autowired private FlightRepository flightRepository;
    @Autowired private PasswordEncoder  passwordEncoder;
    @Autowired private RoleRepository   roleRepository;
    @Autowired private JwtService       jwtService;

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    private boolean isSelf(Authentication auth, Long id) {
        return userRepository.findByEmail(auth.getName())
                .map(User::getId)
                .filter(id::equals)
                .isPresent();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> listAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (!isAdmin(auth) && !isSelf(auth, id)) {
            return ResponseEntity.status(403).build();
        }

        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping(value = "/{id}/avatar", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<Resource> getAvatar(@PathVariable Long id) {

        String fileName = userRepository.findById(id)
                .map(User::getProfilePicture)
                .filter(s -> !s.isBlank())
                .orElse("profile_picture_default.jpg");

        Path file = AVATAR_DIR.resolve(fileName);

        if (Files.notExists(file)) {
            file = AVATAR_DIR.resolve("profile_picture_default.jpg");
        }

        Resource img = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .contentType(MediaType.IMAGE_JPEG)
                .body(img);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        User user = opt.get();

        if (user.getProfilePicture() != null) {
            try { Files.deleteIfExists(AVATAR_DIR.resolve(user.getProfilePicture())); }
            catch (Exception ignored) {}
        }

        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id,
                                             @RequestBody UpdateUserDTO dto) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!isAdmin(auth) && !isSelf(auth, id)) return ResponseEntity.status(403).build();

        return saveUser(auth, id, dto, false);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<String> patchUser(@PathVariable Long id,
                                            @RequestBody UpdateUserDTO dto) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!isAdmin(auth) && !isSelf(auth, id)) return ResponseEntity.status(403).build();

        return saveUser(auth, id, dto, true);
    }

    /**
     * FIX: Role IDs môže meniť iba ADMIN.
     * Ak bežný používateľ pošle roleIds v PATCH/PUT, vrátime 403.
     */
    private ResponseEntity<String> saveUser(Authentication auth, Long id, UpdateUserDTO dto, boolean patch) {

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User user = opt.get();

        if (!patch || dto.getName()    != null) user.setName(dto.getName());
        if (!patch || dto.getSurname() != null) user.setSurname(dto.getSurname());
        if (!patch || dto.getEmail()   != null) user.setEmail(dto.getEmail());
        if (!patch || dto.getRegion()  != null) user.setRegion(dto.getRegion());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        // --- BEZPEČNOSŤ: roly môže meniť iba ADMIN ---
        if (dto.getRoleIds() != null) {

            if (!isAdmin(auth)) {
                return ResponseEntity.status(403).body("roles can be changed only by admin");
            }

            if (dto.getRoleIds().isEmpty()) {
                return ResponseEntity.badRequest().body("roleIds cannot be empty");
            }

            Collection<Role> roles = roleRepository.findAllById(dto.getRoleIds());
            if (roles.size() != dto.getRoleIds().size()) {
                return ResponseEntity.badRequest().body("bad role id");
            }

            user.setRoles(roles);
        }

        userRepository.save(user);
        return ResponseEntity.ok("user updated");
    }

    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadAvatar(@PathVariable Long id,
                                               @RequestParam("file") MultipartFile file) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!isAdmin(auth) && !isSelf(auth, id)) return ResponseEntity.status(403).build();

        if (file.isEmpty()) return ResponseEntity.badRequest().body("file is empty");

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        try {
            if (Files.notExists(AVATAR_DIR)) Files.createDirectories(AVATAR_DIR);

            String ext      = Optional.ofNullable(file.getOriginalFilename())
                    .filter(n -> n.contains("."))
                    .map(n -> n.substring(n.lastIndexOf('.') + 1))
                    .orElse("png");
            String fileName = "user_" + id + "." + ext;
            Path   target   = AVATAR_DIR.resolve(fileName);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            User user = opt.get();
            user.setProfilePicture(fileName);
            userRepository.save(user);

            return ResponseEntity.ok("avatar updated");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("could not store file: " + e.getMessage());
        }
    }
}
