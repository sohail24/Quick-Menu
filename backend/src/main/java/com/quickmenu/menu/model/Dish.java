package com.quickmenu.menu.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Where(clause = "deleted_at IS NULL")
@Table(name = "dishes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dish {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name="uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String restaurantId;

    private String categoryId;
    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private String imageUrl;

    @Builder.Default
    private Boolean isAvailable = true;

    private Integer prepTimeMins;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    private String tags;

    // Demo data management
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDemo = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
