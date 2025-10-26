package com.quickmenu.orders.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    public enum Status {
        PENDING, IN_PROGRESS, READY, SERVED, CANCELLED
    }

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name="uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String restaurantId;

    @Column(nullable = false)
    private String tableId;

    @Column(length = 2000)
    private String customerNote;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private BigDecimal totalAmount;

    @Column(name = "placed_at", nullable = false)
    private Instant placedAt;

    @PrePersist
    public void prePersist() {
        if (placedAt == null) {
            placedAt = Instant.now();
        }
    }

    // Not mapped; kept for DTO mapping convenience
    @Transient
    private List<OrderItem> items;
}
