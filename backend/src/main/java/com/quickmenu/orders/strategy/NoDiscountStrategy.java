package com.quickmenu.orders.strategy;

import com.quickmenu.orders.model.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class NoDiscountStrategy implements DiscountStrategy {
    @Override
    public BigDecimal applyDiscount(Order order, BigDecimal originalTotal) {
        return originalTotal;
    }

    @Override
    public String getStrategyName() {
        return "NO_DISCOUNT";
    }
}
