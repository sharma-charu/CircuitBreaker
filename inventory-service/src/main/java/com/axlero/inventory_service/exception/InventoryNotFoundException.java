package com.axlero.inventory_service.exception;

public class InventoryNotFoundException extends RuntimeException {

    public InventoryNotFoundException(String message) {
        super(message);
    }

    public InventoryNotFoundException(Long productId) {
        super("Inventory not found for product ID: " + productId);
    }
}
