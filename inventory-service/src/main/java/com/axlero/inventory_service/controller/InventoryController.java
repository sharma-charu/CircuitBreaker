package com.axlero.inventory_service.controller;

import com.axlero.inventory_service.dto.InventoryRequest;
import com.axlero.inventory_service.dto.StockAvailabilityResponse;
import com.axlero.inventory_service.model.Inventory;
import com.axlero.inventory_service.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/{productId}")
    public ResponseEntity<Inventory> getInventory(@PathVariable Long productId) {
        Inventory inventory = inventoryService.getInventory(productId);
        return ResponseEntity.ok(inventory);
    }

    @PostMapping
    public ResponseEntity<Inventory> createInventory(@Valid @RequestBody InventoryRequest request) {
        Inventory created = inventoryService.createInventory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<Inventory> updateInventory(
            @PathVariable Long productId,
            @Valid @RequestBody InventoryRequest request) {
        Inventory updated = inventoryService.updateInventory(productId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteInventory(@PathVariable Long productId) {
        inventoryService.deleteInventory(productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{productId}/in-stock")
    public ResponseEntity<StockAvailabilityResponse> checkInStock(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        StockAvailabilityResponse response = inventoryService.checkStockAvailability(productId, quantity);
        return ResponseEntity.ok(response);
    }
}
