package ukf.backend.Service.cloud;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class CloudHttpConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder b, CloudInboxProperties props) {
        return b
                .setConnectTimeout(Duration.ofMillis(props.httpTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(props.httpTimeoutMs()))
                .build();
    }
}