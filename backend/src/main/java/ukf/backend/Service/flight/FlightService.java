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
import ukf.backend.dtos.FlightStatsDto;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final FlightRepository flightRepo;
    private final FlightRecordRepository recordRepo;

    private static final int COLS = 14;
    private static final int BATCH_SIZE = 500;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("H:mm:ss");

    @Transactional
    public Flight ingestFile(MultipartFile file, User owner) throws IOException {
        Flight flight = flightRepo.save(Flight.builder()
                .user(owner)
                .name(file.getOriginalFilename())
                .build());

        List<FlightRecord> buf = new ArrayList<>(BATCH_SIZE);
        LocalTime first = null, last = null;

        Double totalDistanceKm = 0.0;
        Double prevLat = null, prevLon = null;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            br.readLine();

            String line;
            while ((line = br.readLine()) != null) {
                String[] t = line.trim().split("\\s+");
                if (t.length < COLS) continue;

                Double lat = toD(t[1]);
                Double lon = toD(t[2]);

                if (prevLat != null && prevLon != null && lat != null && lon != null) {
                    totalDistanceKm += haversine(prevLat, prevLon, lat, lon);
                }

                prevLat = lat;
                prevLon = lon;

                FlightRecord rec = FlightRecord.builder()
                        .flight(flight)
                        .time(LocalTime.parse(t[0], TIME_FMT))
                        .latitude(lat)
                        .longitude(lon)
                        .temperatureC(toD(t[3]))
                        .pressureHpa(toD(t[4]))
                        .altitudeM(toD(t[5]))
                        .imuX(toD(t[6]))
                        .imuY(toD(t[7]))
                        .imuZ(toD(t[8]))
                        .turbulenceG(toD(t[9]))
                        .speedKn(toD(t[13]))
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
        flight.setEndTime(last != null ? last.atDate(LocalDate.now()) : null);
        flight.setRecordCount(Math.toIntExact(recordRepo.countByFlightId(flight.getId())));
        flight.setDistanceKm(Math.round(totalDistanceKm * 100.0) / 100.0);

        return flightRepo.save(flight);
    }

    @Transactional(readOnly = true)
    public List<FlightRecord> getRecords(Long flightId) {
        return recordRepo.findByFlightId(flightId);
    }

    @Transactional(readOnly = true)
    public FlightStatsDto getStats(Long flightId) {
        List<FlightRecord> records = recordRepo.findByFlightId(flightId);
        if (records.isEmpty()) {
            throw new RuntimeException("No records found for flight " + flightId);
        }

        DoubleSummaryStatistics tempStats = records.stream().mapToDouble(FlightRecord::getTemperatureC).summaryStatistics();
        DoubleSummaryStatistics pressureStats = records.stream().mapToDouble(FlightRecord::getPressureHpa).summaryStatistics();
        DoubleSummaryStatistics altitudeStats = records.stream().mapToDouble(FlightRecord::getAltitudeM).summaryStatistics();
        DoubleSummaryStatistics turbulenceStats = records.stream().mapToDouble(FlightRecord::getTurbulenceG).summaryStatistics();
        DoubleSummaryStatistics speedStats = records.stream().mapToDouble(FlightRecord::getSpeedKn).summaryStatistics();

        Flight flight = flightRepo.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found: " + flightId));

        Duration duration = Duration.between(flight.getStartTime(), flight.getEndTime());

        return FlightStatsDto.builder()
                .minTemperatureC(tempStats.getMin())
                .maxTemperatureC(tempStats.getMax())
                .avgTemperatureC(tempStats.getAverage())
                .minPressureHpa(pressureStats.getMin())
                .maxPressureHpa(pressureStats.getMax())
                .avgPressureHpa(pressureStats.getAverage())
                .minAltitudeM(altitudeStats.getMin())
                .maxAltitudeM(altitudeStats.getMax())
                .avgAltitudeM(altitudeStats.getAverage())
                .minTurbulenceG(turbulenceStats.getMin())
                .maxTurbulenceG(turbulenceStats.getMax())
                .avgTurbulenceG(turbulenceStats.getAverage())
                .minSpeedKn(speedStats.getMin())
                .maxSpeedKn(speedStats.getMax())
                .avgSpeedKn(speedStats.getAverage())
                .recordCount(records.size())
                .duration(String.format("%02d:%02d:%02d", duration.toHours(), duration.toMinutesPart(), duration.toSecondsPart()))
                .build();
    }

    public List<Flight> findFlightsForUser(Long userId) {
        return flightRepo.findAll().stream()
                .filter(f -> f.getUser().getId().equals(userId))
                .toList();
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

    private Double toD(String s) {
        if (s == null) return null;
        s = s.replace(',', '.').trim();
        return s.isEmpty() ? null : Double.parseDouble(s);
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
}