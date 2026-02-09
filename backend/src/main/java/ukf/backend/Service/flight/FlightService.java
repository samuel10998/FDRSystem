package ukf.backend.Service.flight;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import ukf.backend.dtos.FlightStatsDto;
import ukf.backend.Exception.FlightUploadException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.DoubleStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightService {

    private final FlightRepository flightRepo;
    private final FlightRecordRepository recordRepo;

    private static final int COLS = 14;
    private static final int BATCH_SIZE = 500;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("H:mm:ss");

    /** Report z ingestu – použije controller pre response */
    public record IngestReport(
            Flight flight,
            int recordsSaved,
            int badLines,
            Integer firstBadLineNumber,
            String firstBadLinePreview,
            String firstBadLineReason
    ) {}

    /** Backward-compatible */
    @Transactional
    public Flight ingestFile(MultipartFile file, User owner) throws IOException {
        return ingestFileWithReport(file, owner).flight();
    }

    @Transactional
    public IngestReport ingestFileWithReport(MultipartFile file, User owner) throws IOException {

        if (file == null) {
            throw new FlightUploadException(
                    "Chýba súbor (file).",
                    0, null, null, "MISSING_FILE"
            );
        }

        if (file.isEmpty()) {
            throw new FlightUploadException(
                    "Súbor je prázdny.",
                    0, null, null, "EMPTY_FILE"
            );
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) originalName = "upload.txt";

        // flight vytvoríme hneď, ale ak neskôr hodíme exception v @Transactional,
        // tak sa rollbackne a nezostane v DB
        Flight flight = flightRepo.save(Flight.builder()
                .user(owner)
                .name(originalName)
                .build());

        List<FlightRecord> buf = new ArrayList<>(BATCH_SIZE);
        LocalTime first = null, last = null;

        double totalDistanceKm = 0.0;
        Double prevLat = null, prevLon = null;

        int recordsSaved = 0;
        int badLines = 0;
        Integer firstBadLineNumber = null;
        String firstBadLinePreview = null;
        String firstBadLineReason = null;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String header = br.readLine();
            if (header == null) {
                throw new FlightUploadException(
                        "Súbor je prázdny (chýba header).",
                        0, null, null, "EMPTY_FILE"
                );
            }

            String line;
            int lineNo = 1; // header je 1

            while ((line = br.readLine()) != null) {
                lineNo++;

                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                String preview = trimmed.length() > 200 ? trimmed.substring(0, 200) + "..." : trimmed;

                try {
                    String[] t = trimmed.split("\\s+");
                    if (t.length < COLS) {
                        throw new IllegalArgumentException("Not enough columns: " + t.length + " < " + COLS);
                    }

                    LocalTime time = LocalTime.parse(t[0], TIME_FMT);

                    Double lat = parseDoubleStrict(t[1]);
                    Double lon = parseDoubleStrict(t[2]);

                    if (prevLat != null && prevLon != null && lat != null && lon != null) {
                        totalDistanceKm += haversine(prevLat, prevLon, lat, lon);
                    }
                    prevLat = lat;
                    prevLon = lon;

                    FlightRecord rec = FlightRecord.builder()
                            .flight(flight)
                            .time(time)
                            .latitude(lat)
                            .longitude(lon)
                            .temperatureC(parseDoubleStrict(t[3]))
                            .pressureHpa(parseDoubleStrict(t[4]))
                            .altitudeM(parseDoubleStrict(t[5]))
                            .imuX(parseDoubleStrict(t[6]))
                            .imuY(parseDoubleStrict(t[7]))
                            .imuZ(parseDoubleStrict(t[8]))
                            .turbulenceG(parseDoubleStrict(t[9]))
                            .speedKn(parseDoubleStrict(t[13]))
                            .build();

                    buf.add(rec);
                    recordsSaved++;

                    if (first == null) first = time;
                    last = time;

                    if (buf.size() == BATCH_SIZE) {
                        recordRepo.saveAll(buf);
                        buf.clear();
                    }

                } catch (Exception ex) {
                    badLines++;

                    if (firstBadLineNumber == null) {
                        firstBadLineNumber = lineNo;
                        firstBadLinePreview = preview;
                        firstBadLineReason = ex.getMessage();
                        // len prvý zlý riadok ako WARN
                        log.warn("Bad line {} in file '{}': {} | preview='{}'",
                                lineNo, originalName, ex.getMessage(), preview);
                    } else {
                        // ďalšie ako DEBUG aby to nespamovalo
                        log.debug("Bad line {} in file '{}': {}", lineNo, originalName, ex.getMessage());
                    }

                    // skip
                }
            }
        }

        if (!buf.isEmpty()) {
            recordRepo.saveAll(buf);
            buf.clear();
        }

        if (recordsSaved == 0) {
            throw new FlightUploadException(
                    "Upload zlyhal: nenašiel som žiadne platné záznamy. Skontroluj formát súboru (stĺpce) a oddeľovanie (tab/medzera).",
                    badLines,
                    firstBadLineNumber,
                    firstBadLinePreview,
                    firstBadLineReason
            );
        }

        flight.setStartTime(first != null ? first.atDate(LocalDate.now()) : null);
        flight.setEndTime(last != null ? last.atDate(LocalDate.now()) : null);
        flight.setRecordCount(recordsSaved);
        flight.setDistanceKm(Math.round(totalDistanceKm * 100.0) / 100.0);

        Flight savedFlight = flightRepo.save(flight);

        return new IngestReport(
                savedFlight,
                recordsSaved,
                badLines,
                firstBadLineNumber,
                firstBadLinePreview,
                firstBadLineReason
        );
    }

    @Transactional(readOnly = true)
    public List<FlightRecord> getRecords(Long flightId) {
        return recordRepo.findByFlightId(flightId);
    }

    @Transactional(readOnly = true)
    public FlightStatsDto getStats(Long flightId) {
        List<FlightRecord> records = recordRepo.findByFlightId(flightId);
        if (records.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No records found for flight " + flightId);
        }

        DoubleSummaryStatistics temp = stats(records, FlightRecord::getTemperatureC);
        DoubleSummaryStatistics pressure = stats(records, FlightRecord::getPressureHpa);
        DoubleSummaryStatistics altitude = stats(records, FlightRecord::getAltitudeM);
        DoubleSummaryStatistics turbulence = stats(records, FlightRecord::getTurbulenceG);
        DoubleSummaryStatistics speed = stats(records, FlightRecord::getSpeedKn);

        Flight flight = flightRepo.findById(flightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found: " + flightId));

        Duration duration = (flight.getStartTime() != null && flight.getEndTime() != null)
                ? Duration.between(flight.getStartTime(), flight.getEndTime())
                : Duration.ZERO;

        return FlightStatsDto.builder()
                .minTemperatureC(safeMin(temp))
                .maxTemperatureC(safeMax(temp))
                .avgTemperatureC(temp.getCount() > 0 ? temp.getAverage() : 0)

                .minPressureHpa(safeMin(pressure))
                .maxPressureHpa(safeMax(pressure))
                .avgPressureHpa(pressure.getCount() > 0 ? pressure.getAverage() : 0)

                .minAltitudeM(safeMin(altitude))
                .maxAltitudeM(safeMax(altitude))
                .avgAltitudeM(altitude.getCount() > 0 ? altitude.getAverage() : 0)

                .minTurbulenceG(safeMin(turbulence))
                .maxTurbulenceG(safeMax(turbulence))
                .avgTurbulenceG(turbulence.getCount() > 0 ? turbulence.getAverage() : 0)

                .minSpeedKn(safeMin(speed))
                .maxSpeedKn(safeMax(speed))
                .avgSpeedKn(speed.getCount() > 0 ? speed.getAverage() : 0)

                .recordCount(records.size())
                .duration(String.format("%02d:%02d:%02d",
                        duration.toHours(), duration.toMinutesPart(), duration.toSecondsPart()))
                .build();
    }

    public List<Flight> findFlightsForUser(Long userId) {
        return flightRepo.findAllByUserIdOrderByStartTimeDesc(userId);
    }

    public Flight getFlight(Long flightId, User requestor) {
        Flight f = flightRepo.findById(flightId).orElseThrow(() -> notFound(flightId));
        if (!isOwnerOrAdmin(f, requestor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return f;
    }

    @Transactional
    public void deleteFlight(Long flightId, User requestor) {
        Flight f = flightRepo.findById(flightId).orElseThrow(() -> notFound(flightId));
        if (!isOwnerOrAdmin(f, requestor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        recordRepo.deleteByFlightId(flightId);
        flightRepo.delete(f);
    }

    private boolean isOwnerOrAdmin(Flight f, User u) {
        return f.getUser().getId().equals(u.getId()) || u.hasRole("ROLE_ADMIN");
    }

    private ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight " + id + " not found");
    }

    private Double parseDoubleStrict(String s) {
        if (s == null) return null;
        s = s.replace(',', '.').trim();
        if (s.isEmpty()) return null;
        return Double.parseDouble(s);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rLat1) * Math.cos(rLat2) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private DoubleSummaryStatistics stats(List<FlightRecord> records, java.util.function.Function<FlightRecord, Double> getter) {
        DoubleStream stream = records.stream()
                .map(getter)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue);

        return stream.summaryStatistics();
    }

    private double safeMin(DoubleSummaryStatistics s) {
        return s.getCount() > 0 ? s.getMin() : 0;
    }

    private double safeMax(DoubleSummaryStatistics s) {
        return s.getCount() > 0 ? s.getMax() : 0;
    }
}
