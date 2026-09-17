package com.axlero.inventory_service.dto;

public class StockAvailabilityResponse {

    private Long productId;
    private Integer requestedQuantity;
    private Integer availableQuantity;
    private boolean inStock;
    private String message;

    public StockAvailabilityResponse() {
    }

    public StockAvailabilityResponse(Long productId, Integer requestedQuantity, Integer availableQuantity, boolean inStock, String message) {
        this.productId = productId;
        this.requestedQuantity = requestedQuantity;
        this.availableQuantity = availableQuantity;
        this.inStock = inStock;
        this.message = message;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public boolean isInStock() {
        return inStock;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
