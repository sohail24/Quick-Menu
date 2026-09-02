package com.quickmenu.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ producer configuration for the backend (monolith).
 *
 * We only PRODUCE here — we do not declare queues or bindings.
 * Queue/binding declarations are the responsibility of the CONSUMER
 * (notification-service), following the principle that the consumer
 * owns its queue topology.
 *
 * We DO declare the Topic Exchange here because the producer needs it
 * to exist before publishing. If notification-service also declares the
 * same durable exchange, RabbitMQ treats that as idempotent — no error.
 */
@Configuration
public class RabbitMQProducerConfig {

    public static final String EXCHANGE = "quickmenu.events";

    // Routing keys — these tell RabbitMQ which queues to deliver to
    public static final String ORDER_PLACED_CASH   = "order.placed.cash";
    public static final String ORDER_PLACED_ONLINE = "order.placed.online";
    public static final String ORDER_STATUS_UPDATED = "order.status.updated";

    /**
     * Declare the topic exchange. Durable = survives RabbitMQ restart.
     * The notification-service declares the same exchange — this is fine,
     * RabbitMQ is idempotent for exchange declarations with the same config.
     */
    @Bean
    public TopicExchange quickmenuEventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    /**
     * Use JSON serialization for messages instead of Java serialization.
     * This is critical for cross-service compatibility — notification-service
     * is a different JVM and cannot deserialize Java-serialized objects.
     */
    @Bean
    public Jackson2JsonMessageConverter producerJacksonConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(producerJacksonConverter());
        return template;
    }
}
