package com.quickmenu.menu.service;

import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.repo.TableRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TableService {

    private final TableRepository tableRepository;
    private final String baseUrl;

    public TableService(TableRepository tableRepository,
                        @Value("${app.base-url:http://localhost:8080}") String baseUrl) {
        this.tableRepository = tableRepository;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length()-1) : baseUrl;
    }

    public TableEntity createTable(String restaurantId, String name) {
        TableEntity t = TableEntity.builder()
                .restaurantId(restaurantId)
                .name(name)
                .build();

        // Save to get an id
        TableEntity saved = tableRepository.save(t);

        // Build a QR URL pointing to the public menu with tableId param (you can change format)
        String qrUrl = String.format("%s/api/%s/menu?tableId=%s", baseUrl, restaurantId, saved.getId());
        saved.setQrUrl(qrUrl);

        // Persist qrUrl
        return tableRepository.save(saved);
    }

    public List<TableEntity> listTables(String restaurantId) {
        return tableRepository.findByRestaurantId(restaurantId);
    }

    public TableEntity getTable(String restaurantId, String tableId) {
        return tableRepository.findById(tableId)
                .filter(t -> t.getRestaurantId().equals(restaurantId))
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
    }

    public void deleteTable(String restaurantId, String tableId) {
        TableEntity t = getTable(restaurantId, tableId);
        if (Boolean.TRUE.equals(t.getIsDemo())) {
            t.setDeletedAt(java.time.Instant.now());
            tableRepository.save(t);
        } else {
            tableRepository.delete(t);
        }
    }
}
