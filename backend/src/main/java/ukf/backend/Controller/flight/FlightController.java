package ukf.backend.Controller.flight;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import ukf.backend.Model.User.User;                  // User leží v Model/User
import ukf.backend.Service.flight.FlightService;
import ukf.backend.Model.User.UserService;           // aj UserService máš v Model/User
import ukf.backend.dtos.flight.FlightDto;
import ukf.backend.Model.flight.Flight;

import java.io.IOException;
import java.security.Principal;


@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;
    private final UserService userService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','HOST','ADMIN')")
    public ResponseEntity<FlightDto> upload(@RequestPart("file") MultipartFile file,
                                            Principal principal) throws IOException {

        User current = userService.getByEmail(principal.getName());
        Flight flight = flightService.ingestFile(file, current);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(FlightDto.from(flight));
    }
}
