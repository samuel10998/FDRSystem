
package ukf.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.Role.RoleRepository;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @GetMapping
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @PostMapping
    public Role createRole(@RequestBody Role role) {
        return roleRepository.save(role);
    }

    @GetMapping("/{id}")
    public Role getRoleById(@PathVariable Long id) {
        return roleRepository.findById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public Role updateRole(@PathVariable Long id, @RequestBody Role roleDetails) {
        Role role = roleRepository.findById(id).orElse(null);
        if (role != null) {
            role.setName(roleDetails.getName());
            return roleRepository.save(role);
        }
        return null;
    }

    @DeleteMapping("/{id}")
    public void deleteRole(@PathVariable Long id) {
        roleRepository.deleteById(id);
    }
}