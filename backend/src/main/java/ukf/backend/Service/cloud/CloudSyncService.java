package ukf.backend.Service.cloud;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ukf.backend.Model.User.User;
import ukf.backend.Service.device.DeviceService;
import ukf.backend.Service.flight.FlightService;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudSyncService {

    private final CloudInboxClient cloud;
    private final FlightService flightService;

    // ✅ ownership/permission check
    private final DeviceService deviceService;

    @Transactional
    public CloudSyncResult syncDevice(User user, String deviceId) throws Exception {

        // ✅ user musí vlastniť device (admin môže všetko podľa requireOwnedDevice)
        deviceService.requireOwnedDevice(user, deviceId);

        Map<String, Object> pending = cloud.pendingFlights(deviceId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> flights = (List<Map<String, Object>>) pending.get("pending");

        int imported = 0;
        int skipped = 0;

        if (flights == null || flights.isEmpty()) {
            return new CloudSyncResult(imported, skipped);
        }

        for (Map<String, Object> f : flights) {
            String flightId = (String) f.get("flightId");
            Number chunksN = (Number) f.get("chunks");
            int chunks = chunksN != null ? chunksN.intValue() : 0;

            if (chunks <= 0) { skipped++; continue; }

            StringBuilder sb = new StringBuilder();
            boolean ok = true;

            for (int i = 1; i <= chunks; i++) {
                String name = String.format("%06d.log", i);
                try {
                    String part = cloud.downloadChunk(deviceId, flightId, name);
                    if (part == null) { ok = false; break; }
                    sb.append(part);
                    if (!part.endsWith("\n")) sb.append("\n");
                } catch (Exception ex) {
                    ok = false;
                    break;
                }
            }

            if (!ok) {
                skipped++;
                continue;
            }

            String fileName = "cloud_" + deviceId + "_" + flightId + ".txt";
            flightService.ingestTextContentWithReport(fileName, sb.toString(), user);

            cloud.ack(deviceId, flightId);
            imported++;
        }

        return new CloudSyncResult(imported, skipped);
    }

    public record CloudSyncResult(int imported, int skipped) {}
}