package com.quickmenu.bell.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BellEvent implements Serializable {
    private String eventType;      // BELL_CREATED
    private String bellId;
    private String restaurantId;
    private String tableId;
    private Instant createdAt;
}
