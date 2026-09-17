package com.axlero.inventory_service.service;

import com.axlero.inventory_service.model.Inventory;
import com.axlero.inventory_service.repository.InventoryRepository;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    public Inventory getInventory(Long productId) {
        return inventoryRepository.findByProductId(productId).orElse(null);
    }

    public Inventory createInventory(Inventory inventory) {
        return inventoryRepository.save(inventory);
    }

    public Inventory updateInventory(Long productId, Inventory inventory) {
        Inventory existingInventory = inventoryRepository.findByProductId(productId).orElse(null);
        if (existingInventory == null) {
            return null;
        }
        existingInventory.setQuantity(inventory.getQuantity());
        return inventoryRepository.save(existingInventory);
    }

    public boolean deleteInventory(Long productId) {
        Inventory existingInventory = inventoryRepository.findByProductId(productId).orElse(null);
        if (existingInventory == null) {
            return false;
        }
        inventoryRepository.delete(existingInventory);
        return true;
    }

}
