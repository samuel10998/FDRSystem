package ukf.backend.Repository.flight;

import org.springframework.data.jpa.repository.JpaRepository;
import ukf.backend.Model.flight.FlightRecord;

import java.util.List;

public interface FlightRecordRepository extends JpaRepository<FlightRecord, Long> {
    List<FlightRecord> findByFlightId(Long flightId);
    long countByFlightId(Long flightId);
}
