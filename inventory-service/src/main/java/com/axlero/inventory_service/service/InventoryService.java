package com.axlero.inventory_service.service;

import com.axlero.inventory_service.dto.InventoryRequest;
import com.axlero.inventory_service.dto.StockAvailabilityResponse;
import com.axlero.inventory_service.exception.InvalidInventoryRequestException;
import com.axlero.inventory_service.exception.InventoryNotFoundException;
import com.axlero.inventory_service.model.Inventory;
import com.axlero.inventory_service.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional(readOnly = true)
    public Inventory getInventory(Long productId) {
        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));
    }

    @Transactional(readOnly = true)
    public Optional<Inventory> findInventoryByProductId(Long productId) {
        return inventoryRepository.findByProductId(productId);
    }

    @Transactional
    public Inventory createInventory(InventoryRequest request) {
        Optional<Inventory> existing = inventoryRepository.findByProductId(request.getProductId());
        Inventory inventory;
        if (existing.isPresent()) {
            inventory = existing.get();
            inventory.setQuantity(request.getQuantity());
        } else {
            inventory = new Inventory();
            inventory.setProductId(request.getProductId());
            inventory.setQuantity(request.getQuantity());
        }
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public Inventory createInventory(Inventory inventory) {
        Optional<Inventory> existing = inventoryRepository.findByProductId(inventory.getProductId());
        if (existing.isPresent()) {
            Inventory existingInventory = existing.get();
            existingInventory.setQuantity(inventory.getQuantity());
            return inventoryRepository.save(existingInventory);
        }
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public Inventory updateInventory(Long productId, InventoryRequest request) {
        Inventory existingInventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        existingInventory.setQuantity(request.getQuantity());
        return inventoryRepository.save(existingInventory);
    }

    @Transactional
    public Inventory updateInventory(Long productId, Inventory inventory) {
        Inventory existingInventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        existingInventory.setQuantity(inventory.getQuantity());
        return inventoryRepository.save(existingInventory);
    }

    @Transactional
    public void deleteInventory(Long productId) {
        Inventory existingInventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        inventoryRepository.delete(existingInventory);
    }

    @Transactional(readOnly = true)
    public StockAvailabilityResponse checkStockAvailability(Long productId, Integer requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new InvalidInventoryRequestException("Requested quantity must be greater than zero");
        }

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        boolean inStock = inventory.getQuantity() >= requestedQuantity;
        String message = inStock
                ? "Product " + productId + " is in stock"
                : "Product " + productId + " has insufficient stock (Available: " + inventory.getQuantity() + ", Requested: " + requestedQuantity + ")";

        return new StockAvailabilityResponse(
                productId,
                requestedQuantity,
                inventory.getQuantity(),
                inStock,
                message
        );
    }
}
