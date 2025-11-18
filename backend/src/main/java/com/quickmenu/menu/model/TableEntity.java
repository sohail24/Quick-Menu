package com.quickmenu.menu.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;

@Entity
@Table(name = "restaurant_tables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableEntity {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name="uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String restaurantId;

    @Column(nullable = false)
    private String name;

    @Column(length = 1024)
    private String qrUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "occupied", nullable = false)
    private Boolean occupied;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (occupied == null){
            occupied = false;
        }
    }
}
