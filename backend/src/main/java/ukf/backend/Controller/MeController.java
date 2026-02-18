package ukf.backend.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserService;
import ukf.backend.Service.device.DeviceService;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MeController {

    private final UserService userService;
    private final DeviceService deviceService;

    @GetMapping("/api/me")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<?> me(Principal principal) {
        User current = userService.getByEmail(principal.getName());

        boolean hasAnyDevice = deviceService.hasAnyDevice(current);

        return ResponseEntity.ok(Map.of(
                "id", current.getId(),
                "email", current.getEmail(),
                "name", current.getName(),
                "surname", current.getSurname(),
                "deviceRequest", String.valueOf(current.getDeviceRequest()),
                "hasAnyDevice", hasAnyDevice
        ));
    }
}