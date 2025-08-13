package ukf.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FlightStatsDto {
    private double minTemperatureC;
    private double maxTemperatureC;
    private double avgTemperatureC;

    private double minPressureHpa;
    private double maxPressureHpa;
    private double avgPressureHpa;

    private double minAltitudeM;
    private double maxAltitudeM;
    private double avgAltitudeM;

    // Turbulence (G)
    private double minTurbulenceG;
    private double maxTurbulenceG;
    private double avgTurbulenceG;

    private long recordCount;
    private String duration;
}
