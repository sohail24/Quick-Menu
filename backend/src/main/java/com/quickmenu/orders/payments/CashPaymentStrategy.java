package com.quickmenu.orders.payments;

import com.quickmenu.orders.model.Order;
import org.springframework.stereotype.Component;

@Component("CASH")
public class CashPaymentStrategy implements PaymentStrategy {
    @Override
    public void processPayment(Order order) {
        order.setPaymentMethod(Order.PaymentMethod.CASH);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
    }

    @Override
    public String getMethodName() {
        return "CASH";
    }
}
