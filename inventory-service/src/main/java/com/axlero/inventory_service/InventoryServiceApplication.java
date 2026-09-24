package com.axlero.inventory_service;

import com.axlero.inventory_service.model.Inventory;
import com.axlero.inventory_service.repository.InventoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class InventoryServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(InventoryServiceApplication.class, args);
	}

	@Bean
	CommandLineRunner initInventory(InventoryRepository repo) {
		return args -> {
			if (repo.count() == 0) {
				repo.save(new Inventory(null, 1L, 50));
				repo.save(new Inventory(null, 2L, 42));
				repo.save(new Inventory(null, 3L, 18));
				repo.save(new Inventory(null, 4L, 95));
				repo.save(new Inventory(null, 5L, 120));
				repo.save(new Inventory(null, 6L, 34));
			}
		};
	}
}

