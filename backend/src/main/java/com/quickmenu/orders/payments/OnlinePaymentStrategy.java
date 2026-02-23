package com.quickmenu.orders.payments;

import com.quickmenu.orders.model.Order;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component("ONLINE")
public class OnlinePaymentStrategy implements PaymentStrategy {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void processPayment(Order order) {
        order.setPaymentMethod(Order.PaymentMethod.ONLINE);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(frontendUrl + "/order/success/" + order.getId() + "?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/order/cancel/" + order.getId() + "?restaurantId=" + order.getRestaurantId() + "&tableId=" + order.getTableId())
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("inr")
                                    .setUnitAmount(order.getTotalAmount().multiply(new java.math.BigDecimal("100")).longValue())
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName("QuickMenu Order")
                                            .setDescription("Payment for order #" + order.getId())
                                            .build())
                                    .build())
                            .build())
                    .putMetadata("order_id", order.getId())
                    .putMetadata("restaurant_id", order.getRestaurantId())
                    .build();

            Session session = Session.create(params);
            
            order.setStripeSessionId(session.getId());
            order.setStripeCheckoutUrl(session.getUrl());
        } catch (Exception e) {
            throw new RuntimeException("Failed to create Stripe Session: " + e.getMessage(), e);
        }
    }

    @Override
    public String getMethodName() {
        return "ONLINE";
    }
}
