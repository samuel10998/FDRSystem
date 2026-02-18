package ukf.backend.Service.device;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import ukf.backend.Model.User.User;
import ukf.backend.Model.device.Device;
import ukf.backend.Repository.device.DeviceRepository;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepo;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom RND = new SecureRandom();

    public record AdminCreateDeviceResult(String deviceId, String deviceKeyPlain, String pairingCode) {}

    @Transactional
    public AdminCreateDeviceResult adminCreateDevice() {
        String deviceId = "DEV_" + randomHex(6);
        String deviceKey = randomHex(16);
        String pairing = "PAIR_" + randomHex(5);

        Device d = Device.builder()
                .deviceId(deviceId)
                .deviceKeyHash(passwordEncoder.encode(deviceKey))
                .deviceKeyPlain(deviceKey)
                .pairingCode(pairing)
                .createdAt(LocalDateTime.now())
                .build();

        deviceRepo.save(d);
        return new AdminCreateDeviceResult(deviceId, deviceKey, pairing);
    }

    // ✅ NEW: admin assigns brand-new generated device to a specific user
    @Transactional
    public AdminCreateDeviceResult adminAssignNewDeviceToUser(User user) {
        AdminCreateDeviceResult created = adminCreateDevice();

        Device d = deviceRepo.findByDeviceId(created.deviceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Device not found after create"));

        d.setOwner(user);
        d.setPairedAt(LocalDateTime.now());
        deviceRepo.save(d);

        return created; // returns deviceKeyPlain + pairingCode (only once)
    }

    @Transactional(readOnly = true)
    public List<Device> listMyDevices(User user) {
        return deviceRepo.findAllByOwnerId(user.getId());
    }

    @Transactional(readOnly = true)
    public boolean hasAnyDevice(User user) {
        return deviceRepo.existsByOwnerId(user.getId());
    }

    // ✅ NEW: used in AdminDeviceRequestsController
    @Transactional(readOnly = true)
    public long countMyDevices(User user) {
        return deviceRepo.countByOwnerId(user.getId());
    }

    @Transactional
    public Device pair(User user, String pairingCode) {
        Device d = deviceRepo.findByPairingCode(pairingCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pairing code not found"));

        if (d.getOwner() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Device is already paired");
        }

        d.setOwner(user);
        d.setPairedAt(LocalDateTime.now());
        return deviceRepo.save(d);
    }

    @Transactional(readOnly = true)
    public Device requireOwnedDevice(User user, String deviceId) {
        Device d = deviceRepo.findByDeviceId(deviceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found"));

        boolean isAdmin = user.hasRole("ROLE_ADMIN");
        if (!isAdmin) {
            if (d.getOwner() == null || !d.getOwner().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your device");
            }
        }
        return d;
    }

    private String randomHex(int bytes) {
        byte[] b = new byte[bytes];
        RND.nextBytes(b);
        return HexFormat.of().formatHex(b);
    }
}