package com.example.productservice.controller;

import com.example.productservice.model.Product;
import com.example.productservice.repository.ProductRepository;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product getProductById(
            @PathVariable @NonNull Long id) {

        return productRepository.findById(id).orElse(null);
    }

    @PostMapping

public Product addProduct(@RequestBody @NonNull Product product) {
    return productRepository.save(product);
}

    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable @NonNull Long id,
            @RequestBody Product product) {

        Product existingProduct =
                productRepository.findById(id).orElse(null);

        if (existingProduct == null) {
            return null;
        }

        existingProduct.setName(product.getName());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setQuantity(product.getQuantity());

        return productRepository.save(existingProduct);
    }

    @DeleteMapping("/{id}")
    public String deleteProduct(
            @PathVariable @NonNull Long id) {

        if (!productRepository.existsById(id)) {
            return "Product not found";
        }

        productRepository.deleteById(id);

        return "Product deleted successfully";
    }

    @GetMapping("/simulate/delay")
    public java.util.Map<String, Object> simulateDelay(@RequestParam(defaultValue = "3000") int durationMs) throws InterruptedException {
        int safeDelay = Math.min(Math.max(durationMs, 0), 30000);
        Thread.sleep(safeDelay);
        return java.util.Map.of("status", "delayed_response", "delayedMs", safeDelay, "message", "Simulated latency of " + safeDelay + "ms");
    }

    @GetMapping("/simulate/fault")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> simulateFault(@RequestParam(defaultValue = "500") int statusCode) {
        org.springframework.http.HttpStatus status = org.springframework.http.HttpStatus.resolve(statusCode);
        if (status == null || !status.isError()) {
            status = org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return org.springframework.http.ResponseEntity.status(status).body(java.util.Map.of("status", "simulated_error", "statusCode", status.value()));
    }
}