package ukf.backend.Controller.device;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import ukf.backend.Model.User.DeviceRequest;
import ukf.backend.Model.User.User;
import ukf.backend.Model.User.UserRepository;
import ukf.backend.Service.device.DeviceService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDeviceRequestsController {

    private final UserRepository userRepo;
    private final DeviceService deviceService;

    /**
     * ✅ Admin list: users who requested a device
     */
    @GetMapping("/device-requests")
    public ResponseEntity<List<Map<String, Object>>> listDeviceRequests() {

        List<User> users = userRepo.findByDeviceRequest(DeviceRequest.NEEDS_DEVICE);

        List<Map<String, Object>> out = new ArrayList<>();

        for (User u : users) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", u.getId());
            row.put("email", u.getEmail());
            row.put("name", u.getName());
            row.put("surname", u.getSurname());
            row.put("region", u.getRegion());
            row.put("deviceRequest", String.valueOf(u.getDeviceRequest()));
            row.put("hasAnyDevice", deviceService.hasAnyDevice(u));
            row.put("deviceCount", deviceService.countMyDevices(u));
            out.add(row);
        }

        return ResponseEntity.ok(out);
    }

    /**
     * ✅ Admin action: assign a NEW device to user
     */
    @PostMapping("/{id}/assign-device")
    public ResponseEntity<Map<String, Object>> assignDevice(@PathVariable Long id) {

        User target = userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var device = deviceService.adminAssignNewDeviceToUser(target);

        // po pridelení už nepotrebuje zariadenie
        target.setDeviceRequest(DeviceRequest.HAS_OWN_DEVICE);
        userRepo.save(target);

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", target.getId());
        resp.put("email", target.getEmail());
        resp.put("deviceId", device.deviceId());
        resp.put("deviceKeyPlain", device.deviceKeyPlain());
        resp.put("pairingCode", device.pairingCode());

        return ResponseEntity.ok(resp);
    }
}