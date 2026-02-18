package ukf.backend.Controller.device;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserService;
import ukf.backend.Service.device.DeviceService;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class MyDevicesController {

    private final DeviceService deviceService;
    private final UserService userService;

    public record PairRequest(String pairingCode) {}

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<?> myDevices(Principal principal) {
        User current = userService.getByEmail(principal.getName());

        var out = deviceService.listMyDevices(current).stream()
                .map(d -> Map.of(
                        "id", d.getId(),
                        "deviceId", d.getDeviceId(),
                        "pairedAt", d.getPairedAt(),
                        "deviceKeyPlain", d.getDeviceKeyPlain()
                ))
                .toList();

        return ResponseEntity.ok(out);
    }

    @PostMapping("/pair")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<?> pair(@RequestBody PairRequest req, Principal principal) {
        User current = userService.getByEmail(principal.getName());
        return ResponseEntity.ok(deviceService.pair(current, req.pairingCode()));
    }
}