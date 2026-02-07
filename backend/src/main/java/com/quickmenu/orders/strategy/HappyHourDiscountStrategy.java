package com.quickmenu.orders.strategy;

import com.quickmenu.orders.model.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;

@Component
public class HappyHourDiscountStrategy implements DiscountStrategy {
    
    @Override
    public BigDecimal applyDiscount(Order order, BigDecimal originalTotal) {
        LocalTime now = LocalTime.now();
        // Happy hour between 4 PM and 7 PM
        if (now.isAfter(LocalTime.of(16, 0)) && now.isBefore(LocalTime.of(19, 0))) {
            return originalTotal.multiply(new BigDecimal("0.80")); // 20% off
        }
        return originalTotal;
    }

    @Override
    public String getStrategyName() {
        return "HAPPY_HOUR";
    }
}
