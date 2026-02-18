package ukf.backend.Service.cloud;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloud.inbox")
public record CloudInboxProperties(
        String baseUrl,
        String syncToken,
        int httpTimeoutMs
) {}