package ukf.backend.Model.flight;

import jakarta.persistence.*;
import lombok.*;
import ukf.backend.Model.User.User;          // <‑‑ odkaz na tvoju existujúcu entitu User

import java.time.LocalDateTime;

@Entity
@Table(name = "flights")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Flight {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;                 // majiteľ uploadu

    private String name;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer recordCount;
    private Double distanceKm;         // voliteľné – na neskôr
}
