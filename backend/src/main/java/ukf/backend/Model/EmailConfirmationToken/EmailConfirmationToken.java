package ukf.backend.Model.EmailConfirmationToken;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Id;
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

    @OneToOne
    private User user;
}
