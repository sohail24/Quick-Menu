package com.quickmenu.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares the RabbitMQ topology this service needs.
 *
 * Exchange:  quickmenu.events   (topic) — shared with backend
 * Queue:     notification.orders.queue  — this service reads from
 * Binding:   order.placed.*  and  order.status.*  route into the queue
 *
 * Dead Letter Exchange (DLX):
 *   If a message is rejected or times out, it lands in quickmenu.dlq
 *   instead of disappearing. This is what guarantees at-least-once delivery.
 */
@Configuration
public class RabbitMQConfig {

    // ── Exchange names ────────────────────────────────────────────────────────
    public static final String EXCHANGE = "quickmenu.events";
    public static final String DLX      = "quickmenu.dlx";

    // ── Queue names ───────────────────────────────────────────────────────────
    public static final String ORDERS_QUEUE = "notification.orders.queue";
    public static final String BELLS_QUEUE  = "notification.bells.queue";
    public static final String DLQ          = "quickmenu.dlq";

    // ── Routing keys this service cares about ─────────────────────────────────
    public static final String ORDER_PLACED_KEY = "order.placed.*";    // matches order.placed.cash, order.placed.online
    public static final String ORDER_STATUS_KEY = "order.status.*";    // matches order.status.updated, etc.
    public static final String BELL_KEY         = "bell.ring";

    // ── Topic Exchange — backend publishes here ───────────────────────────────
    @Bean
    public TopicExchange quickmenuEventsExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE).durable(true).build();
    }

    // ── Dead Letter Exchange — failed messages land here ─────────────────────
    @Bean
    public DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange(DLX).durable(true).build();
    }

    // ── Dead Letter Queue ─────────────────────────────────────────────────────
    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ).build();
    }

    @Bean
    public Binding dlqBinding(Queue deadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetterQueue).to(deadLetterExchange).with(DLQ);
    }

    // ── Orders Queue ──────────────────────────────────────────────────────────
    // x-dead-letter-exchange tells RabbitMQ: if a message is rejected,
    // forward it to our DLX instead of dropping it.
    @Bean
    public Queue ordersQueue() {
        return QueueBuilder.durable(ORDERS_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }

    @Bean
    public Binding ordersPlacedBinding(Queue ordersQueue, TopicExchange quickmenuEventsExchange) {
        return BindingBuilder.bind(ordersQueue).to(quickmenuEventsExchange).with(ORDER_PLACED_KEY);
    }

    @Bean
    public Binding ordersStatusBinding(Queue ordersQueue, TopicExchange quickmenuEventsExchange) {
        return BindingBuilder.bind(ordersQueue).to(quickmenuEventsExchange).with(ORDER_STATUS_KEY);
    }

    // ── Bells Queue ───────────────────────────────────────────────────────────
    @Bean
    public Queue bellsQueue() {
        return QueueBuilder.durable(BELLS_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }

    @Bean
    public Binding bellsBinding(Queue bellsQueue, TopicExchange quickmenuEventsExchange) {
        return BindingBuilder.bind(bellsQueue).to(quickmenuEventsExchange).with(BELL_KEY);
    }

    // ── JSON message converter ────────────────────────────────────────────────
    // Tells Spring AMQP to serialize/deserialize messages as JSON
    // instead of Java serialization (which is brittle across services)
    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        return factory;
    }
}
