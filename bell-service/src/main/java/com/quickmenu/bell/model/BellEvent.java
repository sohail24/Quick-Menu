package com.quickmenu.bell.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;

@Entity
@Table(name = "bell_events", indexes = {
        @Index(name = "idx_bell_rest_status_created", columnList = "restaurant_id, status, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BellEvent {

    public enum Status {
        PENDING, ACKED, TIMEOUT
    }

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(length = 36)
    private String id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "table_id", nullable = false)
    private String tableId;

    @org.hibernate.annotations.Formula("(SELECT t.name FROM restaurant_tables t WHERE t.id = table_id)")
    private String tableName;

    @Column(length = 2000)
    private String message;

    @Column(name = "source")
    private String source; // "QR", "WEB", "APP"

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "ack_by")
    private String ackBy;

    @Column(name = "ack_at")
    private Instant ackAt;

    @Column(name = "delivered")
    private Boolean delivered = false;

    @Column(name = "attempts")
    private Integer attempts = 0;
}
