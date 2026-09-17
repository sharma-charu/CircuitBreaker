# API Gateway

## Overview

API Gateway is the entry point for the CircuitBreaker cloud-native e-commerce application.

It receives client requests and routes them to the appropriate microservices using Spring Cloud Gateway and service discovery through Eureka.

## Configuration

* **Application Name:** `api-Gateway`
* **Port:** `8080`
* **Service Discovery:** Netflix Eureka
* **Eureka Server:** `https://circuit-breaker-s6d7.onrender.com`

## Eureka Integration

The API Gateway registers itself with the deployed Eureka Server and discovers available microservices through Eureka.

The Eureka configuration is:

```properties
eureka.client.service-url.defaultZone=https://circuit-breaker-s6d7.onrender.com/eureka/
eureka.client.register-with-eureka=true
eureka.client.fetch-registry=true
```

## Current Routes

### Inventory Service

Requests matching:

```text
/inventory/**
```

are routed to:

```text
INVENTORY-SERVICE
```

using Eureka service discovery:

```properties
spring.cloud.gateway.routes[0].uri=lb://INVENTORY-SERVICE
```

Current flow:

```text
Client
   ↓
API Gateway :8080
   ↓
Eureka Service Discovery
   ↓
Inventory Service :8082
```

## Resilience

Resilience4j support has been added to the API Gateway as the foundation for implementing circuit-breaker functionality.

The circuit-breaker and fallback behavior for the Recommendation Service will be configured once the current Recommendation Service API is available.

## Running the Gateway

From the API Gateway directory, run:

```bash
./mvnw spring-boot:run
```

The Gateway runs on:

```text
http://localhost:8080
```

## Technologies

* Java
* Spring Boot
* Spring Cloud Gateway
* Spring Cloud Netflix Eureka
* Resilience4j
* Maven
