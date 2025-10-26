package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.service.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
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
    public ResponseEntity<List<TableEntity>> listTables(@PathVariable String restaurantId) {
        return ResponseEntity.ok(tableService.listTables(restaurantId));
    }

    @GetMapping("/{tableId}")
    public ResponseEntity<TableEntity> getTable(@PathVariable String restaurantId,
                                                @PathVariable String tableId) {
        return ResponseEntity.ok(tableService.getTable(restaurantId, tableId));
    }

    @DeleteMapping("/{tableId}")
    public ResponseEntity<?> deleteTable(@PathVariable String restaurantId,
                                         @PathVariable String tableId) {
        tableService.deleteTable(restaurantId, tableId);
        return ResponseEntity.noContent().build();
    }
}
