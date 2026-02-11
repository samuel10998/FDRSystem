package ukf.backend.Model.AuditLog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "actor_id")
    private Long actorId;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(name = "target_id")
    private Long targetId;

    @Column(length = 64)
    private String ip;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(length = 1024)
    private String details;
}
