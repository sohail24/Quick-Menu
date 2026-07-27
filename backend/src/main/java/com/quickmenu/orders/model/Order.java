package com.quickmenu.orders.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where;
import org.hibernate.annotations.Formula;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Where(clause = "deleted_at IS NULL")
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    public enum Status {
        PLACED, PENDING, IN_PROGRESS, READY, SERVED, CANCELLED, PREPARING
    }

    public enum PaymentMethod {
        CASH, ONLINE
    }

    public enum PaymentStatus {
        PENDING, PAID, CANCELLED
    }

    @Id
    @GeneratedValue
    @org.hibernate.annotations.UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String restaurantId;

    public enum OrderType {
        DINE_IN, TAKEAWAY
    }

    @Column(length = 36)
    private String tableId;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type")
    @Builder.Default
    private OrderType orderType = OrderType.DINE_IN;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    @Column(length = 2000)
    private String customerNote;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @Formula("(CASE WHEN status IN ('PLACED','PENDING','IN_PROGRESS','PREPARING','READY') THEN 0 ELSE 1 END)")
    private int statusPriority;

    private BigDecimal totalAmount;

    private String requestId; // For Idempotency

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String appliedDiscountStrategy; // For Strategy Pattern tracking

    @Column(length = 1000)
    private String stripeSessionId;
    @Column(length = 1000)
    private String stripeCheckoutUrl;

    @Column(name = "order_token", length = 36)
    private String orderToken;

    @Column(name = "placed_at", nullable = false)
    private Instant placedAt;

    @PrePersist
    public void prePersist() {
        if (placedAt == null) {
            placedAt = Instant.now();
        }
    }

    // Demo data management
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDemo = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> items;
}
