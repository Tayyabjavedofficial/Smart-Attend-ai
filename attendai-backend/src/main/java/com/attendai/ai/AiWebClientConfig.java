package com.attendai.ai;

import com.attendai.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@RequiredArgsConstructor
public class AiWebClientConfig {

    private final AppProperties props;

    @Bean
    public WebClient aiWebClient() {
        return WebClient.builder()
                .baseUrl(props.ai().baseUrl())
                .defaultHeader("X-Service-Key", props.ai().serviceKey())
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
