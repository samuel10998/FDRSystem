package ukf.backend.dtos.flight;

import ukf.backend.Model.flight.Flight;

import java.time.LocalDateTime;

public record FlightDto(
        Long id,
        String name,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer recordCount,
        Double distanceKm
) {
    public static FlightDto from(Flight f) {
        return new FlightDto(
                f.getId(),
                f.getName(),
                f.getStartTime(),
                f.getEndTime(),
                f.getRecordCount(),
                f.getDistanceKm()
        );
    }
}
