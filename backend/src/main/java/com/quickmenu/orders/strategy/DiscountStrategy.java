package com.quickmenu.orders.strategy;

import com.quickmenu.orders.model.Order;
import java.math.BigDecimal;

public interface DiscountStrategy {
    BigDecimal applyDiscount(Order order, BigDecimal originalTotal);
    String getStrategyName();
}
