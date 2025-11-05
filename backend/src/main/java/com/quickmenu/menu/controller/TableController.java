package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.repo.TableRepository;
import com.quickmenu.menu.service.TableService;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
public class TableController {

    private final TableService tableService;
    private final TableRepository tableRepository;

    public TableController(TableService tableService, TableRepository tableRepository) {
        this.tableService = tableService;
        this.tableRepository = tableRepository;
    }

    @PostMapping
    public ResponseEntity<TableEntity> createTable(@PathVariable String restaurantId,
                                                   @RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "Table");
        TableEntity created = tableService.createTable(restaurantId, name);
        return ResponseEntity.created(URI.create("/api/restaurants/" + restaurantId + "/tables/" + created.getId()))
                .body(created);
    }

    @GetMapping
    public ResponseEntity<Page<TableEntity>> listTables(@PathVariable String restaurantId,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size,
                                                        @RequestParam(defaultValue = "id") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        Page<TableEntity> p = tableRepository.findByRestaurantId(restaurantId, pageable);
        return ResponseEntity.ok(p);
    }

    @GetMapping("/{tableId}")
    public ResponseEntity<TableEntity> getTable(@PathVariable String restaurantId,
                                                @PathVariable String tableId) {
        TableEntity t = tableService.getTable(restaurantId, tableId);
        return ResponseEntity.ok(t);
    }

    @DeleteMapping("/{tableId}")
    public ResponseEntity<?> deleteTable(@PathVariable String restaurantId,
                                         @PathVariable String tableId) {
        tableService.deleteTable(restaurantId, tableId);
        return ResponseEntity.noContent().build();
    }

    private Sort.Order[] parseSort(String[] sort) {
        return java.util.Arrays.stream(sort)
                .map(s -> {
                    String[] parts = s.split(",");
                    String prop = parts[0].trim();
                    Sort.Direction dir = parts.length > 1 ? Sort.Direction.fromString(parts[1].trim()) : Sort.Direction.ASC;
                    return new Sort.Order(dir, prop);
                }).toArray(Sort.Order[]::new);
    }
}
