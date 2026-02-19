package ukf.backend.dtos.cloud;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CloudSyncRequest(
        @NotBlank(message = "deviceId is required")
        @Pattern(regexp = "^DEV_[a-f0-9]{12}$", message = "deviceId must match DEV_<12 hex chars>")
        String deviceId
) {}
