package ukf.backend.Model.flight;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "flight_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FlightRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id", nullable = false)
    @JsonIgnore
    private Flight flight;

    private LocalTime time;       // 09:35:24
    private Double latitude;      // 48.279933
    private Double longitude;     // 18.135084
    private Double temperatureC;  // 29.82
    private Double pressureHpa;   // 1009.62
    private Double altitudeM;     // 29.89
    private Double imuX;
    private Double imuY;
    private Double imuZ;
}
