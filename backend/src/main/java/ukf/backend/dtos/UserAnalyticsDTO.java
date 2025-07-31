package ukf.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserAnalyticsDTO {
    private int totalFlights;
    private long totalRecords;
    private long averageDurationSeconds;
    private double totalDistanceKm;

}

