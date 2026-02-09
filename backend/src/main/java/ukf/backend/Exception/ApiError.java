package ukf.backend.Exception;

public record ApiError(
        String message,
        int badLines,
        Integer firstBadLineNumber,
        String firstBadLinePreview,
        String firstBadLineReason
) {}
