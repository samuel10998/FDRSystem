package ukf.backend.Model.flight;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import ukf.backend.Model.User.User;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flights")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ––––– majiteľ uploadu ––––– */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore                   // zabráni cyklu v JSONe
    private User user;

    private String        name;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer       recordCount;
    private Double        distanceKm;

    /* ––––– záznamy z letu –––––
       CascadeType.ALL  → všetky operácie (persist, merge, remove…)
       orphanRemoval=true → vymaže detské entity, ktoré sa odstránia z kolekcie */
    @OneToMany(mappedBy = "flight",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<FlightRecord> records = new ArrayList<>();
}
