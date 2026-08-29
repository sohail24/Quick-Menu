package com.quickmenu.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Configuration for Notification Service
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Architecture: Topic Exchange Pattern
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Exchange: quickmenu.events (Topic Exchange)
 *   ↓ Routing Key: order.placed.#  → notification.orders.queue
 *   ↓ Routing Key: order.status.#  → notification.orders.queue
 *   ↓ Routing Key: bell.#          → notification.bells.queue
 *
 * Dead Letter Queue (DLQ):
 *   If notification delivery fails (e.g., service crash), messages are
 *   routed to quickmenu.dlq via quickmenu.dlx (DL Exchange).
 *   On restart, these messages are retried — guaranteeing at-least-once delivery.
 *
 * Interview talking point: "We use DLQ to handle transient failures without
 * losing events. This is a fundamental principle in distributed systems —
 * messages must not be silently dropped."
 * ─────────────────────────────────────────────────────────────────────────
 */
@Configuration
public class RabbitMQConfig {

    // ── Exchange & Queue names (constants prevent typos) ──────────────────
    public static final String EXCHANGE            = "quickmenu.events";
    public static final String ORDERS_QUEUE        = "notification.orders.queue";
    public static final String BELLS_QUEUE         = "notification.bells.queue";
    public static final String DLX_EXCHANGE        = "quickmenu.dlx";
    public static final String DLQ                 = "quickmenu.dlq";

    // Routing key patterns (# = wildcard matching multiple words in Topic exchange)
    public static final String ORDER_ROUTING_KEY   = "order.#";
    public static final String BELL_ROUTING_KEY    = "bell.#";

    // ── Dead Letter Exchange (DLX) ────────────────────────────────────────
    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DLX_EXCHANGE);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ).build();
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with(DLQ);
    }

    // ── Main Topic Exchange ───────────────────────────────────────────────
    /**
     * Topic Exchange allows routing based on wildcard patterns.
     * "order.placed.cash" matches "order.#"
     * "bell.ring" matches "bell.#"
     *
     * This is more flexible than Direct Exchange — adding a new consumer
     * (e.g., analytics-service) just requires a new binding, zero code change.
     */
    @Bean
    public TopicExchange quickmenuEventsExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE)
                .durable(true)
                .build();
    }

    // ── Orders Queue (with DLQ fallback) ─────────────────────────────────
    @Bean
    public Queue ordersQueue() {
        return QueueBuilder.durable(ORDERS_QUEUE)
                // If a message fails / is rejected, route it to the DLX
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }

    @Bean
    public Binding ordersQueueBinding() {
        return BindingBuilder.bind(ordersQueue())
                .to(quickmenuEventsExchange())
                .with(ORDER_ROUTING_KEY);
    }

    // ── Bells Queue (with DLQ fallback) ──────────────────────────────────
    @Bean
    public Queue bellsQueue() {
        return QueueBuilder.durable(BELLS_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }

    @Bean
    public Binding bellsQueueBinding() {
        return BindingBuilder.bind(bellsQueue())
                .to(quickmenuEventsExchange())
                .with(BELL_ROUTING_KEY);
    }

    // ── Message Converter — JSON serialisation ────────────────────────────
    /**
     * Use Jackson for JSON serialisation/deserialisation.
     * Without this, Spring uses Java serialization (brittle across services).
     * JSON is language-agnostic — a Node.js service could consume the same events.
     */
    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonMessageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jacksonMessageConverter());
        // Acknowledge mode: MANUAL gives full control; AUTO is simpler and fine for our use case
        factory.setAcknowledgeMode(AcknowledgeMode.AUTO);
        return factory;
    }
}
