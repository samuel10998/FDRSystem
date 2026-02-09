package ukf.backend.dtos.flight;

import ukf.backend.Model.flight.Flight;
import ukf.backend.Service.flight.FlightService;

public record FlightIngestResultDto(
        FlightDto flight,
        int recordsSaved,
        int badLines,
        Integer firstBadLineNumber,
        String firstBadLinePreview
) {
    public static FlightIngestResultDto from(FlightService.IngestReport r) {
        Flight f = r.flight();
        return new FlightIngestResultDto(
                FlightDto.from(f),
                r.recordsSaved(),
                r.badLines(),
                r.firstBadLineNumber(),
                r.firstBadLinePreview()
        );
    }
}
