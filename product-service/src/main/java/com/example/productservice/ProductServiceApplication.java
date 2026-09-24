package com.example.productservice;

import com.example.productservice.model.Product;
import com.example.productservice.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ProductServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProductServiceApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(ProductRepository repository) {
		return args -> {
			if (repository.count() == 0) {
				repository.save(new Product(null, "Quantum HyperX Gaming Laptop", "16-core CPU, RTX 4090, 64GB DDR5, 240Hz OLED Display", 2499.99, 18));
				repository.save(new Product(null, "AcousticPro Studio Headphones", "Active Noise Cancelling, Spatial Audio 3D, 40h Battery", 349.99, 42));
				repository.save(new Product(null, "UltraVision 4K OLED Monitor 34\"", "Curved Ultrawide, 175Hz, 0.03ms Response, HDR1000", 999.00, 12));
				repository.save(new Product(null, "Mechanical Ergonomic Keyboard", "Hot-swappable tactile switches, Wireless BT 5.2, RGB Backlit", 159.50, 65));
				repository.save(new Product(null, "Precision Wireless Master Mouse", "26K DPI Optical Sensor, Ergonomic Thumb Rest, Fast Charge", 89.99, 90));
				repository.save(new Product(null, "Smart Ambient Desk Bar Light", "Screen-glare free illumination, Auto-dimming sensor, App control", 69.00, 34));
			}
		};
	}
}

