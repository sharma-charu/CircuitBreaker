package com.axlero.inventory_service.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class InventorySimulationControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private InventorySimulationController simulationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(simulationController).build();
    }

    @Test
    void simulateDelay_withShortDuration_shouldReturn200() throws Exception {
        mockMvc.perform(get("/inventory/simulate/delay").param("durationMs", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("delayed_response")))
                .andExpect(jsonPath("$.delayedMs", is(50)));
    }

    @Test
    void simulateFault_shouldReturn500() throws Exception {
        mockMvc.perform(get("/inventory/simulate/fault").param("statusCode", "500"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status", is("simulated_error")))
                .andExpect(jsonPath("$.statusCode", is(500)));
    }

    @Test
    void simulateStatus_shouldReturn200() throws Exception {
        mockMvc.perform(get("/inventory/simulate/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service", is("inventory-service")))
                .andExpect(jsonPath("$.simulationEnabled", is(true)));
    }
}
