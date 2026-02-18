package ukf.backend.Model.device;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import ukf.backend.Model.User.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "devices", indexes = {
        @Index(name = "idx_devices_device_id", columnList = "deviceId", unique = true),
        @Index(name = "idx_devices_pairing_code", columnList = "pairingCode", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String deviceId;

    // uložené hashom (BCrypt)
    @Column(nullable = false, length = 200)
    @JsonIgnore
    private String deviceKeyHash;

    // ✅ NEW: plain key (quick & dirty - zobrazíme userovi v /api/devices/my)
    @Column(nullable = false, length = 128)
    private String deviceKeyPlain;

    // krátky kód na spárovanie
    @Column(nullable = false, unique = true, length = 32)
    private String pairingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User owner;

    private LocalDateTime createdAt;
    private LocalDateTime pairedAt;
}