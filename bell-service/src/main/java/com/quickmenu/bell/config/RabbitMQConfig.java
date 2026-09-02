package com.quickmenu.bell.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ producer config for bell-service.
 * Same exchange as the backend — both produce to "quickmenu.events".
 * Multiple producers on the same exchange is perfectly valid in AMQP.
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "quickmenu.events";

    @Bean
    public TopicExchange quickmenuEventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Jackson2JsonMessageConverter jacksonConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonConverter());
        return template;
    }
}
