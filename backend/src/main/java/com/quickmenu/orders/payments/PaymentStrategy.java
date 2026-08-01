package com.quickmenu.orders.payments;

import com.quickmenu.orders.model.Order;

public interface PaymentStrategy {
    void processPayment(Order order);
    String getMethodName();
}
