package com.attendai.config.ws;

import com.attendai.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over WebSocket setup. Clients connect to /ws and subscribe to
 * /topic/session/{id}/events for per-session attendance broadcasts and
 * /topic/session/{id}/live for live counters. The frontend uses STOMP.js or
 * @stomp/stompjs for the client side.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AppProperties props;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = props.cors().allowedOrigins().split(",");
        for (int i = 0; i < origins.length; i++) origins[i] = origins[i].trim();
        registry
                .addEndpoint("/ws")
                .setAllowedOriginPatterns(origins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Broadcasts to clients on /topic/*
        registry.enableSimpleBroker("/topic");
        // Clients send to /app/* (unused for now - we only broadcast)
        registry.setApplicationDestinationPrefixes("/app");
    }
}
