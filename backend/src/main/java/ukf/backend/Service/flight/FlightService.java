package ukf.backend.Service.flight;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ukf.backend.Model.User.User;
import ukf.backend.Model.flight.Flight;
import ukf.backend.Model.flight.FlightRecord;
import ukf.backend.Repository.flight.FlightRecordRepository;
import ukf.backend.Repository.flight.FlightRepository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final FlightRepository       flightRepo;
    private final FlightRecordRepository recordRepo;

    /* ----------------------------- upload ----------------------------- */

    private static final int  COLS       = 9;
    private static final int  BATCH_SIZE = 500;
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("H:mm:ss");

    @Transactional
    public Flight ingestFile(MultipartFile file, User owner) throws IOException {

        Flight flight = flightRepo.save(
                Flight.builder()
                        .user(owner)
                        .name(file.getOriginalFilename())
                        .build());

        List<FlightRecord> buf   = new ArrayList<>(BATCH_SIZE);
        LocalTime          first = null, last = null;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            br.readLine();   // preskoč hlavičku

            String line;
            while ((line = br.readLine()) != null) {
                String[] t = line.trim().split("\\s+");
                if (t.length < COLS) continue;

                FlightRecord rec = FlightRecord.builder()
                        .flight       (flight)
                        .time         (LocalTime.parse(t[0], TIME_FMT))
                        .latitude     (toD(t[1]))
                        .longitude    (toD(t[2]))
                        .temperatureC (toD(t[3]))
                        .pressureHpa  (toD(t[4]))
                        .altitudeM    (toD(t[5]))
                        .imuX         (toD(t[6]))
                        .imuY         (toD(t[7]))
                        .imuZ         (toD(t[8]))
                        .build();

                buf.add(rec);

                if (first == null) first = rec.getTime();
                last = rec.getTime();

                if (buf.size() == BATCH_SIZE) {
                    recordRepo.saveAll(buf);
                    buf.clear();
                }
            }
        }
        if (!buf.isEmpty()) recordRepo.saveAll(buf);

        flight.setStartTime(first != null ? first.atDate(LocalDate.now()) : null);
        flight.setEndTime  (last  != null ?  last.atDate(LocalDate.now()) : null);
        flight.setRecordCount(Math.toIntExact(
                recordRepo.countByFlightId(flight.getId())));

        return flightRepo.save(flight);
    }

    /* --------------------------- CRUD helpery ------------------------- */

    /** Všetky lety daného používateľa */
    public List<Flight> findFlightsForUser(Long userId) {
        return flightRepo.findAll().stream()
                .filter(f -> f.getUser().getId().equals(userId))
                .toList();
    }

    /** Detail letu + kontrola práv */
    public Flight getFlight(Long flightId, User requestor) {
        Flight f = flightRepo.findById(flightId)
                .orElseThrow(() -> notFound(flightId));

        if (!isOwnerOrAdmin(f, requestor))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return f;
    }

    /** Vymazanie letu (aj všetkých záznamov) */
    @Transactional
    public void deleteFlight(Long flightId, User requestor) {

        Flight f = flightRepo.findById(flightId)
                .orElseThrow(() -> notFound(flightId));

        if (!isOwnerOrAdmin(f, requestor))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        recordRepo.deleteByFlightId(flightId);
        flightRepo.delete(f);
    }

    /* ----------------------------- utils ------------------------------ */

    private boolean isOwnerOrAdmin(Flight f, User u) {
        return  f.getUser().getId().equals(u.getId())
                || u.hasRole("ROLE_ADMIN");
    }

    private ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Flight " + id + " not found");
    }

    private Double toD(String s) {
        if (s == null) return null;
        s = s.replace(',', '.').trim();
        return s.isEmpty() ? null : Double.parseDouble(s);
    }
}
