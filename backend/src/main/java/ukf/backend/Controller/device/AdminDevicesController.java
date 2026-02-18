package ukf.backend.Controller.device;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ukf.backend.Service.device.DeviceService;

@RestController
@RequestMapping("/api/admin/devices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDevicesController {

    private final DeviceService deviceService;

    @PostMapping
    public ResponseEntity<?> create() {
        return ResponseEntity.ok(deviceService.adminCreateDevice());
    }
}