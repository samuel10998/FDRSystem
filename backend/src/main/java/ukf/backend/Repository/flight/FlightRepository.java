package ukf.backend.Repository.flight;

import org.springframework.data.jpa.repository.JpaRepository;
import ukf.backend.Model.flight.Flight;

public interface FlightRepository extends JpaRepository<Flight, Long> {}
