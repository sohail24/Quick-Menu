package com.quickmenu.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Producer Configuration (Backend / Monolith side)
 *
 * This configures the backend as a MESSAGE PRODUCER only.
 * It does NOT consume — that's the notification-service's job.
 *
 * Producer-side responsibilities:
 *  - Declare the same Topic Exchange (idempotent — safe to declare from multiple services)
 *  - Configure RabbitTemplate with Jackson converter for JSON messages
 *
 * Interview talking point:
 *  "Both the producer (backend) and consumer (notification-service) declare
 *   the exchange. In RabbitMQ, declarations are idempotent — declaring an existing
 *   exchange with the same settings is a no-op. This is important in distributed systems
 *   because startup order is non-deterministic."
 */
@Configuration
public class RabbitMQProducerConfig {

    // Must match exactly what notification-service declares
    public static final String EXCHANGE = "quickmenu.events";

    // Routing key constants — producers use these to target the right queues
    public static final String ORDER_PLACED_CASH    = "order.placed.cash";
    public static final String ORDER_PLACED_ONLINE  = "order.placed.online";
    public static final String ORDER_STATUS_UPDATED = "order.status.updated";
    public static final String ORDER_PAYMENT_VERIFIED = "order.payment.verified";
    public static final String ORDER_ITEMS_APPENDED = "order.items.appended";
    public static final String BELL_RING            = "bell.ring";
    public static final String BELL_ACK             = "bell.ack";

    /**
     * Declare the Topic Exchange.
     * Topic Exchange routes messages based on wildcard routing key patterns.
     * This is more powerful than Direct Exchange and allows future consumers
     * (analytics, audit log) to subscribe to subsets of events without changes here.
     */
    @Bean
    public TopicExchange quickmenuEventsExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE)
                .durable(true) // Survive RabbitMQ restart
                .build();
    }

    /**
     * Jackson converter — serialize Java objects to JSON for the message body.
     * This ensures any consumer (even non-Java) can read the events.
     */
    @Bean
    public MessageConverter producerMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * RabbitTemplate — the primary API for publishing messages.
     * Usage: rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, payload)
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(producerMessageConverter());
        // Mandatory: if no queue is bound to receive this message, throw an exception
        // rather than silently dropping it (important for debugging)
        template.setMandatory(true);
        return template;
    }
}
