package com.quickmenu.orders.service;

import com.quickmenu.bell.service.BellService;
import com.quickmenu.config.customExceptions.TableOccupiedException;
import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.repo.TableRepository;
import com.quickmenu.orders.dto.OrderDto;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.model.OrderItem;
import com.quickmenu.orders.repo.OrderItemRepository;
import com.quickmenu.orders.repo.OrderRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DishRepository dishRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TableRepository tableRepository;
    private final BellService bellService;
    private final com.quickmenu.orders.strategy.DiscountService discountService;
    private final com.quickmenu.orders.payments.PaymentService paymentService;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.publishable-key}")
    private String stripePublishableKey;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        DishRepository dishRepository,
                        SimpMessagingTemplate messagingTemplate,
                        TableRepository tableRepository,
                        BellService bellService,
                        com.quickmenu.orders.strategy.DiscountService discountService,
                        com.quickmenu.orders.payments.PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.dishRepository = dishRepository;
        this.messagingTemplate = messagingTemplate;
        this.tableRepository = tableRepository;
        this.bellService = bellService;
        this.discountService = discountService;
        this.paymentService = paymentService;
    }

    @Transactional
    public Map<String, Object> placeOrder(String restaurantId, OrderDto.CreateOrderRequest req) {
        // Idempotency check
        if (req.getRequestId() != null && !req.getRequestId().isEmpty()) {
            java.util.Optional<Order> existingOrder = orderRepository.findByRequestId(req.getRequestId());
            if (existingOrder.isPresent()) {
                return enrichOrderForResponse(existingOrder.get());
            }
        }

        // find table row with pessimistic lock (for concurrency) or check occupied flag
        boolean isTakeaway = "TAKEAWAY".equalsIgnoreCase(req.getOrderType());
        if (!isTakeaway) {
            TableEntity table = tableRepository.findByIdForUpdate(req.getTableId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid table"));

            if (Boolean.TRUE.equals(table.getOccupied())) {
                long unpaidActive = orderRepository.countUnpaidActiveOrdersOnTable(
                    req.getTableId(),
                    java.util.List.of(Order.Status.CANCELLED, Order.Status.SERVED),
                    Order.PaymentStatus.PAID
                );
                if (unpaidActive > 0) {
                    throw new TableOccupiedException();
                }
            }

            // mark table occupied ONLY if it's CASH (immediate placement)
            // For ONLINE, we defer occupancy until payment is verified
            if (!"ONLINE".equalsIgnoreCase(req.getPaymentMethod())) {
                table.setOccupied(true);
                tableRepository.save(table);
            }
        }

        // validate dishes and compute total
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (OrderDto.CreateOrderItem it : req.getItems()) {
            Dish dish = dishRepository.findById(it.getDishId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid dish: " + it.getDishId()));
            if (dish.getIsAvailable() == null || !dish.getIsAvailable()) {
                throw new IllegalArgumentException("Dish not available: " + dish.getName());
            }
            BigDecimal itemTotal = dish.getPrice().multiply(BigDecimal.valueOf(it.getQuantity()));
            total = total.add(itemTotal);

            OrderItem oi = OrderItem.builder()
                    .dish(dish)
                    .dishName(dish.getName())
                    .quantity(it.getQuantity())
                    .priceAtOrder(dish.getPrice())
                    .note(it.getNote())
                    .build();
            items.add(oi);
        }

        // apply discount strategy
        com.quickmenu.orders.strategy.DiscountStrategy strategy = discountService.getStrategy(req.getDiscountStrategy());
        BigDecimal finalTotal = strategy.applyDiscount(null, total);

        // build order and set back-reference on items
        Order.OrderType oType = isTakeaway ? Order.OrderType.TAKEAWAY : Order.OrderType.DINE_IN;
        Order order = Order.builder()
                .restaurantId(restaurantId)
                .tableId(isTakeaway ? null : req.getTableId())
                .orderType(oType)
                .vehicleNumber(isTakeaway ? req.getVehicleNumber() : null)
                .customerName(req.getCustomerName())
                .customerPhone(req.getCustomerPhone())
                .customerNote(req.getCustomerNote())
                .totalAmount(finalTotal)
                .requestId(req.getRequestId())
                .appliedDiscountStrategy(strategy.getStrategyName())
                .status(Order.Status.PLACED)
                .items(items)
                .orderToken(java.util.UUID.randomUUID().toString())
                .build();

        // set the parent reference on each item
        for (OrderItem it : items) {
            it.setOrder(order);
        }

        // 1. Save order first to generate ID (required for Stripe success_url)
        Order saved = orderRepository.saveAndFlush(order);

        // 2. Process payment via strategy (now saved.getId() is available)
        paymentService.process(saved, req.getPaymentMethod() != null ? req.getPaymentMethod() : "CASH");

        // 3. Save again to persist Stripe session info set by the strategy
        saved = orderRepository.save(saved);

        Map<String, Object> orderPayload = enrichOrderForResponse(saved);
        
        // IMPORTANT: Only notify staff via STOMP if it's CASH (immediate)
        // For ONLINE, we notify in verifyPayment() after payment is successful
        if (saved.getPaymentMethod() != Order.PaymentMethod.ONLINE) {
            messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders", orderPayload);
        }

        return orderPayload;
    }

    @Transactional
    public void cancelOrder(String restaurantId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getRestaurantId().equals(restaurantId)) {
            throw new IllegalArgumentException("Order does not belong to this restaurant");
        }

        // Only allow cancellation of PENDING online orders
        if (order.getPaymentMethod() == Order.PaymentMethod.ONLINE && 
            order.getPaymentStatus() == Order.PaymentStatus.PENDING) {
            
            // Free the table
            if (order.getOrderType() == Order.OrderType.DINE_IN && order.getTableId() != null) {
                TableEntity table = tableRepository.findById(order.getTableId())
                        .orElse(null);
                if (table != null) {
                    table.setOccupied(false);
                    tableRepository.save(table);
                }
            }

            // Delete the order (or mark as CANCELED, but deleting is cleaner if it never happened)
            orderRepository.delete(order);
        }
    }


    public List<Order> listOrders(String restaurantId, Order.Status status) {
        if (status == null) {
            return orderRepository.findByRestaurantId(restaurantId);
        } else {
            return orderRepository.findByRestaurantIdAndStatus(restaurantId, status);
        }
    }

    @Transactional
    public Order updateOrderStatus(String restaurantId, String orderId, Order.Status status, Order.PaymentStatus paymentStatus) {
        Order ord = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if (status != null) {
            ord.setStatus(status);
        }
        
        if (paymentStatus != null) {
            // Protection: Don't allow changing back to PENDING if already PAID
            if (ord.getPaymentStatus() == Order.PaymentStatus.PAID && paymentStatus == Order.PaymentStatus.PENDING) {
                // Ignore or throw exception; ignoring is safer for bulk updates
            } else {
                ord.setPaymentStatus(paymentStatus);
            }
        }

        Order updated = orderRepository.save(ord);

        // Free the table if order is SERVED
        if (Order.Status.SERVED.equals(status) && updated.getTableId() != null) {
            TableEntity table = tableRepository.findById(updated.getTableId())
                    .orElse(null);
            if (table != null) {
                table.setOccupied(false);
                tableRepository.save(table);
            }
        }

        Map<String, Object> orderPayload = enrichOrderForResponse(updated);
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders", orderPayload);

        return updated;
    }

    // Simple event DTO
    public static record OrderEvent(String orderId, String tableId, String type) { }


    /**
     * Enrich order with item details (dishName, etc.)
     * Used for API responses and STOMP messages
     */
    public Map<String, Object> enrichOrderForResponse(Order order) {
        List<Map<String, Object>> itemsWithDetails = order.getItems() != null
                ? order.getItems().stream()
                .map(item -> {
                    Dish dish = dishRepository.findById(item.getDish().getId()).orElse(null);
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("id", item.getId());
                    itemMap.put("dishId", item.getDish().getId());
                    itemMap.put("dishName", dish != null ? dish.getName() : "Unknown Dish");
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("priceAtOrder", item.getPriceAtOrder());
                    itemMap.put("note", item.getNote() != null ? item.getNote() : "");
                    return itemMap;
                })
                .collect(Collectors.toList())
                : List.of();

        Map<String, Object> response = new HashMap<>();
        response.put("id", order.getId());
        response.put("tableId", order.getTableId());
        response.put("tableName", order.getTableName() != null ? order.getTableName() : "");
        response.put("orderType", order.getOrderType() != null ? order.getOrderType().name() : "DINE_IN");
        response.put("vehicleNumber", order.getVehicleNumber() != null ? order.getVehicleNumber() : "");
        response.put("restaurantId", order.getRestaurantId());
        response.put("status", order.getStatus() != null ? order.getStatus().toString() : "PENDING");
        response.put("placedAt", order.getPlacedAt() != null ? order.getPlacedAt().toString() : "");
        response.put("customerName", order.getCustomerName() != null ? order.getCustomerName() : "");
        response.put("customerPhone", order.getCustomerPhone() != null ? order.getCustomerPhone() : "");
        response.put("paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod().toString() : "CASH");
        response.put("paymentStatus", order.getPaymentStatus() != null ? order.getPaymentStatus().toString() : "PENDING");
        response.put("totalAmount", order.getTotalAmount());
        response.put("stripeSessionId", order.getStripeSessionId());
        response.put("stripeCheckoutUrl", order.getStripeCheckoutUrl());
        response.put("orderToken", order.getOrderToken());
        if (order.getPaymentMethod() == Order.PaymentMethod.ONLINE) {
            response.put("stripePublishableKey", stripePublishableKey);
        }
        response.put("items", itemsWithDetails);

        return response;
    }

    @Transactional
    public Map<String, Object> verifyPayment(String restaurantId, String orderId, OrderDto.StripeVerifyRequest verifyReq) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getRestaurantId().equals(restaurantId)) {
            throw new IllegalArgumentException("Order does not belong to this restaurant");
        }

        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            return enrichOrderForResponse(order);
        }

        try {
            com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.retrieve(order.getStripeSessionId());

            if ("complete".equals(session.getStatus()) || "paid".equals(session.getPaymentStatus())) {
                boolean isTakeaway = order.getOrderType() == Order.OrderType.TAKEAWAY;
                
                if (!isTakeaway) {
                    // --- TABLE INTEGRITY CHECK (Pessimistic Locking) ---
                    TableEntity table = tableRepository.findByIdForUpdate(order.getTableId())
                            .orElseThrow(() -> new IllegalArgumentException("Table not found"));
                    
                    if (Boolean.TRUE.equals(table.getOccupied())) {
                        long otherActive = orderRepository.countOtherActiveOrdersOnTable(
                            order.getTableId(), 
                            order.getId(), 
                            java.util.List.of(Order.Status.CANCELLED, Order.Status.SERVED),
                            order.getPlacedAt()
                        );
                        if (otherActive > 0) {
                            // CONFLICT: Table was taken while user was on Stripe!
                            // RELEASE (VOID) the payment hold so customer isn't charged
                            PaymentIntent intent = PaymentIntent.retrieve(session.getPaymentIntent());
                            intent.cancel();
                            
                            // Mark order as CANCELLED in our system
                            order.setStatus(Order.Status.CANCELLED);
                            order.setPaymentStatus(Order.PaymentStatus.CANCELLED);
                            orderRepository.save(order);
                            
                            throw new TableOccupiedException();
                        }
                    }
                    
                    // SUCCESS: Capture the payment hold
                    PaymentIntent intent = PaymentIntent.retrieve(session.getPaymentIntent());
                    intent.capture();
                    
                    // Finalize table status
                    table.setOccupied(true);
                    tableRepository.save(table);
                } else {
                    // Takeaway flow: Just capture the payment hold
                    PaymentIntent intent = PaymentIntent.retrieve(session.getPaymentIntent());
                    intent.capture();
                }
                
                // Finalize order status
                order.setPaymentStatus(Order.PaymentStatus.PAID);
                orderRepository.save(order);
                
                Map<String, Object> orderPayload = enrichOrderForResponse(order);
                messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders", orderPayload);
                return orderPayload;
                
            } else {
                throw new RuntimeException("Payment not completed. Status: " + session.getPaymentStatus());
            }
        } catch (TableOccupiedException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Map<String, Object> appendOrderItems(String restaurantId, String orderId, List<OrderDto.CreateOrderItem> newItemsReq) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getRestaurantId().equals(restaurantId)) {
            throw new IllegalArgumentException("Order does not belong to this restaurant");
        }

        // Check if order status allows appending (not CANCELLED or SERVED)
        if (order.getStatus() == Order.Status.CANCELLED || order.getStatus() == Order.Status.SERVED) {
            throw new IllegalStateException("Cannot add items to a completed or cancelled order");
        }

        List<OrderItem> newItems = new ArrayList<>();
        for (OrderDto.CreateOrderItem it : newItemsReq) {
            Dish dish = dishRepository.findById(it.getDishId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid dish: " + it.getDishId()));
            if (dish.getIsAvailable() == null || !dish.getIsAvailable()) {
                throw new IllegalArgumentException("Dish not available: " + dish.getName());
            }

            OrderItem oi = OrderItem.builder()
                    .dish(dish)
                    .dishName(dish.getName())
                    .quantity(it.getQuantity())
                    .priceAtOrder(dish.getPrice())
                    .note(it.getNote())
                    .order(order)
                    .build();
            newItems.add(oi);
        }

        // Save the new items
        orderItemRepository.saveAll(newItems);

        // Add to existing items collection
        if (order.getItems() == null) {
            order.setItems(new ArrayList<>());
        }
        order.getItems().addAll(newItems);

        // Recompute the total amount using the original discount strategy if applicable
        BigDecimal rawTotal = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            rawTotal = rawTotal.add(item.getPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        String strategyName = order.getAppliedDiscountStrategy();
        com.quickmenu.orders.strategy.DiscountStrategy strategy = discountService.getStrategy(strategyName);
        BigDecimal finalTotal = strategy.applyDiscount(null, rawTotal);
        order.setTotalAmount(finalTotal);

        // If it was already PAID, revert to PENDING for counter payment of additional amount
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            order.setPaymentStatus(Order.PaymentStatus.PENDING);
            order.setPaymentMethod(Order.PaymentMethod.CASH);
        }

        Order updated = orderRepository.save(order);
        Map<String, Object> orderPayload = enrichOrderForResponse(updated);
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders", orderPayload);

        return orderPayload;
    }

    @Transactional
    public Map<String, Object> completeOrderPayment(String restaurantId, String orderId, String paymentMethodStr) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getRestaurantId().equals(restaurantId)) {
            throw new IllegalArgumentException("Order does not belong to this restaurant");
        }

        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            throw new IllegalStateException("Order is already paid");
        }

        Order.PaymentMethod pm = Order.PaymentMethod.valueOf(paymentMethodStr.toUpperCase());
        order.setPaymentMethod(pm);

        if (pm == Order.PaymentMethod.ONLINE) {
            paymentService.process(order, "ONLINE");
        } else {
            order.setPaymentStatus(Order.PaymentStatus.PENDING);
        }

        Order updated = orderRepository.save(order);
        Map<String, Object> orderPayload = enrichOrderForResponse(updated);
        
        if (updated.getPaymentMethod() != Order.PaymentMethod.ONLINE) {
            messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders", orderPayload);
        }

        return orderPayload;
    }
}
