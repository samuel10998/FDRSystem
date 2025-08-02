package ukf.backend.Model.User;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import ukf.backend.Model.Role.Role;
import ukf.backend.Model.flight.Flight;
// ← import your token entity here:
import ukf.backend.Model.EmailConfirmationToken.EmailConfirmationToken;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String  name;
    private String  surname;
    private String  email;
    private String  password;
    private boolean accountVerified;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name               = "users_roles",
            joinColumns        = @JoinColumn(name = "user_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "role_id", referencedColumnName = "id")
    )
    private Collection<Role> roles;

    /**
     * All of this user’s confirmation tokens.
     * We cascade all operations and remove orphans,
     * so deleting the user will also delete these rows.
     */
    @OneToMany(
            mappedBy      = "user",
            cascade       = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnore
    private List<EmailConfirmationToken> confirmationTokens = new ArrayList<>();

    /**
     * All flight records for this user.
     */
    @OneToMany(
            mappedBy      = "user",
            cascade       = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnore
    private List<Flight> flights = new ArrayList<>();

    public boolean hasRole(String roleName) {
        if (roles == null) return false;
        return roles.stream().anyMatch(r -> roleName.equals(r.getName()));
    }
}
