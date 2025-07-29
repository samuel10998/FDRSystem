package ukf.backend.Controller.flight;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserService;
import ukf.backend.Model.flight.Flight;
import ukf.backend.Service.flight.FlightService;
import ukf.backend.dtos.flight.FlightDto;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;
    private final UserService   userService;

    /* ────────────────────────── 1. upload súboru ───────────────────────── */

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<FlightDto> upload(@RequestPart("file") MultipartFile file,
                                            Principal principal) throws IOException {

        User   current = userService.getByEmail(principal.getName());
        Flight flight  = flightService.ingestFile(file, current);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(FlightDto.from(flight));
    }

    /* ────────────────────────── 2. zoznam mojich letov ─────────────────── */

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public List<FlightDto> listMyFlights(Principal principal) {
        User current = userService.getByEmail(principal.getName());
        return flightService.findFlightsForUser(current.getId())
                .stream()
                .map(FlightDto::from)
                .toList();
    }

    /* ────────────────────────── 3. detail letu ─────────────────────────── */

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<FlightDto> getFlight(@PathVariable Long id,
                                               Principal principal) {
        User   current = userService.getByEmail(principal.getName());
        Flight flight  = flightService.getFlight(id, current);   // validácia vlastníka/ADMIN
        return ResponseEntity.ok(FlightDto.from(flight));
    }

    /* ────────────────────────── 4. vymazanie letu ──────────────────────── */

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id,
                                             Principal principal) {
        User current = userService.getByEmail(principal.getName());
        flightService.deleteFlight(id, current);                 // validácia vlastníka/ADMIN
        return ResponseEntity.noContent().build();
    }
}
