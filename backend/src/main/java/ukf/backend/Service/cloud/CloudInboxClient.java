package ukf.backend.Service.cloud;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class CloudInboxClient {

    private final CloudInboxProperties props;
    private final RestTemplate restTemplate;

    private HttpHeaders authHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set("Authorization", "Bearer " + props.syncToken());
        return h;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> pendingFlights(String deviceId) {
        String url = props.baseUrl() + "/pending-flights?deviceId=" + deviceId;
        HttpEntity<Void> req = new HttpEntity<>(authHeaders());
        ResponseEntity<Map> res = restTemplate.exchange(url, HttpMethod.GET, req, Map.class);
        return res.getBody();
    }

    public String downloadChunk(String deviceId, String flightId, String chunkFileName) {
        String url = props.baseUrl() + "/flight/" + deviceId + "/" + flightId + "/" + chunkFileName;
        HttpHeaders h = authHeaders();
        HttpEntity<Void> req = new HttpEntity<>(h);
        ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.GET, req, String.class);
        return res.getBody();
    }

    public void ack(String deviceId, String flightId) {
        String url = props.baseUrl() + "/ack";
        HttpHeaders h = authHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> req = new HttpEntity<>(
                Map.of("deviceId", deviceId, "flightId", flightId), h
        );
        restTemplate.exchange(url, HttpMethod.PUT, req, String.class);
    }
}