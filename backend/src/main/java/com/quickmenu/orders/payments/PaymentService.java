package com.quickmenu.orders.payments;

import com.quickmenu.orders.model.Order;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class PaymentService {
    private final Map<String, PaymentStrategy> strategies;

    public PaymentService(Map<String, PaymentStrategy> strategies) {
        this.strategies = strategies;
    }

    public void process(Order order, String methodName) {
        PaymentStrategy strategy = strategies.get(methodName.toUpperCase());
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown payment method: " + methodName);
        }
        strategy.processPayment(order);
    }
}
