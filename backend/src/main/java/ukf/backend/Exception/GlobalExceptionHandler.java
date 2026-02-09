package ukf.backend.Exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FlightUploadException.class)
    public ResponseEntity<ApiError> handleFlightUpload(FlightUploadException ex) {
        return ResponseEntity.badRequest().body(new ApiError(
                ex.getMessage(),
                ex.getBadLines(),
                ex.getFirstBadLineNumber(),
                ex.getFirstBadLinePreview(),
                ex.getFirstBadLineReason()
        ));
    }
}
