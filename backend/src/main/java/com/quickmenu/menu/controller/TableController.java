package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.service.TableService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.file.FileSystems;
import java.util.List;
import java.util.Map;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
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
}
