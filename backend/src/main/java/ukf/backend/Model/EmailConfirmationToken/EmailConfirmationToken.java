package ukf.backend.Model.EmailConfirmationToken;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.ReadOnlyProperty;
import ukf.backend.Model.User.User;

import java.time.LocalDateTime;

@Entity
@Data
public class EmailConfirmationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String token;

    @CreatedDate
    @ReadOnlyProperty
    private LocalDateTime timeStamp;

    /**
     * Many tokens can point at one user.
     * This lines up with the @OneToMany(mappedBy="user") in your User entity.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
