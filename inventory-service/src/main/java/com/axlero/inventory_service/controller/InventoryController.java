package com.axlero.inventory_service.controller;

import org.springframework.web.bind.annotation.RestController;

import com.axlero.inventory_service.service.InventoryService;
import com.axlero.inventory_service.model.Inventory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/inventory/{productId}")
    public Inventory getInventory(@PathVariable Long productId) {
        return inventoryService.getInventory(productId);
    }

    @PostMapping("/inventory")
    public Inventory createInventory(@RequestBody Inventory inventory) {
        return inventoryService.createInventory(inventory);
    }

    @PutMapping("/inventory/{productId}")
    public Inventory updateInventory(@PathVariable Long productId, @RequestBody Inventory inventory) {
        return inventoryService.updateInventory(productId, inventory);
    }

    @DeleteMapping("/inventory/{productId}")
    public String deleteInventory(@PathVariable Long productId) {
        boolean deleted = inventoryService.deleteInventory(productId);
        if (deleted) {
            return "Inventory deleted successfully";
        } else {
            return "Inventory not found";
        }
    }

}
