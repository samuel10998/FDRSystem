// backend/src/main/java/ukf/backend/Repository/flight/FlightRepository.java
package ukf.backend.Repository.flight;

import org.springframework.data.jpa.repository.JpaRepository;
import ukf.backend.Model.flight.Flight;

import java.util.List;

public interface FlightRepository extends JpaRepository<Flight, Long> {
    List<Flight> findAllByUserIdOrderByStartTimeDesc(Long userId);
}
