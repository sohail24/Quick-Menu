package com.quickmenu.menu.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.repo.TableRepository;
import com.quickmenu.menu.service.TableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
@Tag(name = "Tables", description = "Table management and QR generation")
public class TableController {

    private final TableService tableService;
    private final TableRepository tableRepository;

    public TableController(TableService tableService, TableRepository tableRepository) {
        this.tableService = tableService;
        this.tableRepository = tableRepository;
    }

    @PostMapping
    @Operation(summary = "Create table", description = "Create a table for a restaurant and generate a QR URL.")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<TableEntity> createTable(@PathVariable String restaurantId,
                                                   @RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "Table");
        TableEntity created = tableService.createTable(restaurantId, name);
        return ResponseEntity.created(URI.create("/api/restaurants/" + restaurantId + "/tables/" + created.getId()))
                .body(created);
    }

    @GetMapping
    @Operation(summary = "List tables", description = "List tables for a restaurant (paginated).")
    public ResponseEntity<Page<TableEntity>> listTables(@PathVariable String restaurantId,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size,
                                                        @RequestParam(defaultValue = "id") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        Page<TableEntity> p = tableRepository.findByRestaurantId(restaurantId, pageable);
        return ResponseEntity.ok(p);
    }

    @GetMapping("/{tableId}")
    @Operation(summary = "Get table", description = "Get table details by id.")
    public ResponseEntity<TableEntity> getTable(@PathVariable String restaurantId,
                                                @PathVariable String tableId) {
        TableEntity t = tableService.getTable(restaurantId, tableId);
        return ResponseEntity.ok(t);
    }

    @DeleteMapping("/{tableId}")
    @Operation(summary = "Delete table", description = "Delete table (admin).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> deleteTable(@PathVariable String restaurantId,
                                         @PathVariable String tableId) {
        tableService.deleteTable(restaurantId, tableId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns PNG image of the QR code that encodes the table's qrUrl.
     * Example: GET /api/restaurants/{restaurantId}/tables/{tableId}/qr.png
     */
    @GetMapping("/{tableId}/qr.png")
    @Operation(summary = "Get table QR PNG", description = "Return PNG image of the table's QR code.", responses = {
            @ApiResponse(responseCode = "200", description = "PNG image", content = @Content(mediaType = "image/png"))
    })
    public void getTableQrPng(@PathVariable String restaurantId,
                              @PathVariable String tableId,
                              HttpServletResponse response) throws IOException {
        TableEntity table = tableService.getTable(restaurantId, tableId);
        String url = table.getQrUrl();
        if (url == null || url.isEmpty()) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "QR URL not set for table");
            return;
        }

        try {
            byte[] png = generateQrPng(url, 300, 300);
            response.setContentType("image/png");
            response.setContentLength(png.length);
            response.getOutputStream().write(png);
        } catch (WriterException e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to generate QR");
        }
    }

    // Utility: generate PNG bytes from text using ZXing
    private byte[] generateQrPng(String text, int width, int height) throws WriterException, IOException {
        QRCodeWriter qrWriter = new QRCodeWriter();
        BitMatrix matrix = qrWriter.encode(text, BarcodeFormat.QR_CODE, width, height);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
        return baos.toByteArray();
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
