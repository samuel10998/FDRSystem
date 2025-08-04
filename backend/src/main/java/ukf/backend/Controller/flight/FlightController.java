package ukf.backend.Controller.flight;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserService;
import ukf.backend.Model.flight.Flight;
import ukf.backend.Model.flight.FlightRecord;
import ukf.backend.Service.flight.FlightService;
import ukf.backend.dtos.flight.FlightDto;
import ukf.backend.dtos.FlightStatsDto;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;
    private final UserService   userService;


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<FlightDto> upload(@RequestPart("file") MultipartFile file,
                                            Principal principal) throws IOException {
        User   current = userService.getByEmail(principal.getName());
        Flight flight  = flightService.ingestFile(file, current);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(FlightDto.from(flight));
    }


    @GetMapping
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public List<FlightDto> listMyFlights(Principal principal) {
        User current = userService.getByEmail(principal.getName());
        return flightService.findFlightsForUser(current.getId())
                .stream()
                .map(FlightDto::from)
                .toList();
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<FlightDto> getFlight(@PathVariable Long id,
                                               Principal principal) {
        User current = userService.getByEmail(principal.getName());
        Flight flight = flightService.getFlight(id, current);
        return ResponseEntity.ok(FlightDto.from(flight));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id,
                                             Principal principal) {
        User current = userService.getByEmail(principal.getName());
        flightService.deleteFlight(id, current);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/{id}/records")
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<List<FlightRecord>> getFlightRecords(@PathVariable Long id,
                                                               Principal principal) {
        User current = userService.getByEmail(principal.getName());
        flightService.getFlight(id, current); // validácia vlastníka/ADMIN
        List<FlightRecord> records = flightService.getRecords(id);
        return ResponseEntity.ok(records);
    }


    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<FlightStatsDto> getFlightStats(@PathVariable Long id,
                                                         Principal principal) {
        User current = userService.getByEmail(principal.getName());
        flightService.getFlight(id, current); // validacia ADMIN
        FlightStatsDto stats = flightService.getStats(id);
        return ResponseEntity.ok(stats);
    }
}
