package ukf.backend.Repository.device;

import org.springframework.data.jpa.repository.JpaRepository;
import ukf.backend.Model.device.Device;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByDeviceId(String deviceId);

    Optional<Device> findByPairingCode(String pairingCode);

    List<Device> findAllByOwnerId(Long ownerId);

    // ✅ NEW
    boolean existsByOwnerId(Long ownerId);

    // ✅ NEW
    long countByOwnerId(Long ownerId);
}