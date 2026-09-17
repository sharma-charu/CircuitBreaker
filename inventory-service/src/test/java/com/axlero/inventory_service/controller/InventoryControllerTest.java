package com.axlero.inventory_service.controller;

import com.axlero.inventory_service.dto.InventoryRequest;
import com.axlero.inventory_service.exception.GlobalExceptionHandler;
import com.axlero.inventory_service.model.Inventory;
import com.axlero.inventory_service.repository.InventoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class InventoryControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private InventoryController inventoryController;

    @Autowired
    private GlobalExceptionHandler globalExceptionHandler;

    @Autowired
    private InventoryRepository inventoryRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController)
                .setControllerAdvice(globalExceptionHandler)
                .build();
        inventoryRepository.deleteAll();
    }

    @Test
    void getInventory_whenExists_shouldReturn200AndInventory() throws Exception {
        Inventory inventory = new Inventory();
        inventory.setProductId(101L);
        inventory.setQuantity(50);
        inventoryRepository.save(inventory);

        mockMvc.perform(get("/inventory/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId", is(101)))
                .andExpect(jsonPath("$.quantity", is(50)));
    }

    @Test
    void getInventory_whenNotExists_shouldReturn404() throws Exception {
        mockMvc.perform(get("/inventory/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", containsString("999")));
    }

    @Test
    void createInventory_withValidData_shouldReturn201() throws Exception {
        InventoryRequest request = new InventoryRequest(102L, 25);

        mockMvc.perform(post("/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.productId", is(102)))
                .andExpect(jsonPath("$.quantity", is(25)));
    }

    @Test
    void createInventory_withNegativeQuantity_shouldReturn400() throws Exception {
        InventoryRequest request = new InventoryRequest(103L, -5);

        mockMvc.perform(post("/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    void createInventory_withNullProductId_shouldReturn400() throws Exception {
        InventoryRequest request = new InventoryRequest(null, 10);

        mockMvc.perform(post("/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    void updateInventory_whenExists_shouldReturn200() throws Exception {
        Inventory inventory = new Inventory();
        inventory.setProductId(104L);
        inventory.setQuantity(20);
        inventoryRepository.save(inventory);

        InventoryRequest updateRequest = new InventoryRequest(104L, 80);

        mockMvc.perform(put("/inventory/104")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId", is(104)))
                .andExpect(jsonPath("$.quantity", is(80)));
    }

    @Test
    void updateInventory_whenNotExists_shouldReturn404() throws Exception {
        InventoryRequest updateRequest = new InventoryRequest(999L, 80);

        mockMvc.perform(put("/inventory/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    void deleteInventory_whenExists_shouldReturn204() throws Exception {
        Inventory inventory = new Inventory();
        inventory.setProductId(105L);
        inventory.setQuantity(15);
        inventoryRepository.save(inventory);

        mockMvc.perform(delete("/inventory/105"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteInventory_whenNotExists_shouldReturn404() throws Exception {
        mockMvc.perform(delete("/inventory/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    void checkInStock_whenAvailable_shouldReturn200AndInStockTrue() throws Exception {
        Inventory inventory = new Inventory();
        inventory.setProductId(106L);
        inventory.setQuantity(30);
        inventoryRepository.save(inventory);

        mockMvc.perform(get("/inventory/106/in-stock").param("quantity", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId", is(106)))
                .andExpect(jsonPath("$.requestedQuantity", is(10)))
                .andExpect(jsonPath("$.availableQuantity", is(30)))
                .andExpect(jsonPath("$.inStock", is(true)));
    }

    @Test
    void checkInStock_whenInsufficient_shouldReturn200AndInStockFalse() throws Exception {
        Inventory inventory = new Inventory();
        inventory.setProductId(107L);
        inventory.setQuantity(5);
        inventoryRepository.save(inventory);

        mockMvc.perform(get("/inventory/107/in-stock").param("quantity", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId", is(107)))
                .andExpect(jsonPath("$.requestedQuantity", is(10)))
                .andExpect(jsonPath("$.availableQuantity", is(5)))
                .andExpect(jsonPath("$.inStock", is(false)));
    }

    @Test
    void checkInStock_whenQuantityIsZeroOrNegative_shouldReturn400() throws Exception {
        Inventory inventory = new Inventory();
        inventory.setProductId(108L);
        inventory.setQuantity(20);
        inventoryRepository.save(inventory);

        mockMvc.perform(get("/inventory/108/in-stock").param("quantity", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }

    @Test
    void checkInStock_whenProductNotExists_shouldReturn404() throws Exception {
        mockMvc.perform(get("/inventory/999/in-stock").param("quantity", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }
}
