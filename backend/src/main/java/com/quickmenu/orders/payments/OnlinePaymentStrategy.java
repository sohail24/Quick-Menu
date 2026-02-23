package com.quickmenu.orders.payments;

import com.quickmenu.orders.model.Order;
import org.springframework.stereotype.Component;

@Component("ONLINE")
public class OnlinePaymentStrategy implements PaymentStrategy {
    @Override
    public void processPayment(Order order) {
        order.setPaymentMethod(Order.PaymentMethod.ONLINE);
        order.setPaymentStatus(Order.PaymentStatus.PAID); // Mocking successful payment
    }

    @Override
    public String getMethodName() {
        return "ONLINE";
    }
}
