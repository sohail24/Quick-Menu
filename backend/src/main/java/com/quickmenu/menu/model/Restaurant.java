package com.quickmenu.menu.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.Where;

import java.time.Instant;

@Entity
@Where(clause = "deleted_at IS NULL")
@Table(name = "restaurants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name="uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String name;

    private String timezone;
    private String currency;
    private String address;
    private String ownerUserId;
    private String description;
    private String planId;   // e.g. "free", "premium"
    private String bannerUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

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
