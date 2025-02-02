package ukf.backend.Model.Role;

import jakarta.persistence.*;
import lombok.Data;
import ukf.backend.Model.User.User;

import java.util.Collection;

@Data
@Entity
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;
    @ManyToMany(mappedBy = "roles")
    private Collection<User> users;

}