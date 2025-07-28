package ukf.backend.Service.flight;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
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

    private static final int  COLS       = 9;
    private static final int  BATCH_SIZE = 500;
    private static final DateTimeFormatter TIME_FMT =
            /* H = hodin(y) bez núl vľavo, HH = s nulami */
            DateTimeFormatter.ofPattern("H:mm:ss");

    /* ------------------------------------------------------------------ */

    @Transactional
    public Flight ingestFile(MultipartFile file, User owner) throws IOException {

        Flight flight = flightRepo.save(
                Flight.builder()
                        .user(owner)
                        .name(file.getOriginalFilename())
                        .build());

        List<FlightRecord> buf = new ArrayList<>(BATCH_SIZE);
        LocalTime first = null, last = null;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            /* preskoč hlavičku */
            br.readLine();

            String line;
            while ((line = br.readLine()) != null) {
                String[] t = line.trim().split("\\s+");
                if (t.length < COLS) continue;              // ignoruj neúplné riadky

                FlightRecord rec = FlightRecord.builder()
                        .flight       (flight)
                        .time         (LocalTime.parse(t[0], TIME_FMT)) // ← opravené
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

        /* meta‑údaje letu */
        flight.setStartTime(first != null ? first.atDate(LocalDate.now()) : null);
        flight.setEndTime  (last  != null ?  last.atDate(LocalDate.now()) : null);
        flight.setRecordCount(Math.toIntExact(recordRepo.countByFlightId(flight.getId())));

        return flightRepo.save(flight);
    }

    /* ------------------------------------------------------------------ */

    private Double toD(String s) {
        if (s == null) return null;
        s = s.replace(',','.').trim();
        return s.isEmpty() ? null : Double.parseDouble(s);
    }
}
