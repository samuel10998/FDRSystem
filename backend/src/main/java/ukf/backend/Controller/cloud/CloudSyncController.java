package ukf.backend.Controller.cloud;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserService;
import ukf.backend.Model.User.DeviceRequest;
import ukf.backend.Service.cloud.CloudSyncService;
import ukf.backend.Service.device.DeviceService;
import ukf.backend.dtos.cloud.CloudSyncRequest;

import java.security.Principal;

@RestController
@RequestMapping("/api/cloud")
@RequiredArgsConstructor
public class CloudSyncController {

    private final CloudSyncService syncService;
    private final UserService userService;
    private final DeviceService deviceService;

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<?> sync(@RequestBody CloudSyncRequest req, Principal principal) throws Exception {
        User current = userService.getByEmail(principal.getName());

        // ✅ NEW: user bez prideleného device (a ktorý "NEEDS_DEVICE") nemá čo syncovať
        boolean isAdmin = current.hasRole("ROLE_ADMIN");
        boolean needsDevice = current.getDeviceRequest() == DeviceRequest.NEEDS_DEVICE;

        if (!isAdmin && needsDevice && !deviceService.hasAnyDevice(current)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Nemáš pridelené žiadne zariadenie. Počkaj, kým ti admin pridelí FDR device."
            );
        }

        var result = syncService.syncDevice(current, req.deviceId());
        return ResponseEntity.ok(result);
    }
}