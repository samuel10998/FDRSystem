package ukf.backend.Exception;

import lombok.Getter;

@Getter
public class FlightUploadException extends RuntimeException {
    private final int badLines;
    private final Integer firstBadLineNumber;
    private final String firstBadLinePreview;
    private final String firstBadLineReason;

    public FlightUploadException(String message,
                                 int badLines,
                                 Integer firstBadLineNumber,
                                 String firstBadLinePreview,
                                 String firstBadLineReason) {
        super(message);
        this.badLines = badLines;
        this.firstBadLineNumber = firstBadLineNumber;
        this.firstBadLinePreview = firstBadLinePreview;
        this.firstBadLineReason = firstBadLineReason;
    }
}
