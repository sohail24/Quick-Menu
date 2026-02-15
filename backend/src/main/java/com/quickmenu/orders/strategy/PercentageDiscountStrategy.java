package com.quickmenu.orders.strategy;

import com.quickmenu.orders.model.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PercentageDiscountStrategy implements DiscountStrategy {
    
    private final BigDecimal discountRate = new BigDecimal("0.10"); // 10% discount

    @Override
    public BigDecimal applyDiscount(Order order, BigDecimal originalTotal) {
        BigDecimal discount = originalTotal.multiply(discountRate);
        return originalTotal.subtract(discount);
    }

    @Override
    public String getStrategyName() {
        return "PERCENTAGE_10";
    }
}
