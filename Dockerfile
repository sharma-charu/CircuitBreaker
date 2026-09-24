# ==========================================
# STAGE 1: Build Spring Boot Microservices
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS backend-builder
WORKDIR /workspace

# Copy Maven wrapper & config files
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Copy microservices sources
COPY Eureka-server Eureka-server
COPY api-Gateway api-Gateway
COPY product-service product-service
COPY inventory-service inventory-service
COPY src src

# Make Maven wrapper executable and package all microservices
RUN chmod +x ./mvnw \
    && ./mvnw clean package -DskipTests \
    && cd Eureka-server && ../mvnw clean package -DskipTests && cd .. \
    && cd api-Gateway && ../mvnw clean package -DskipTests && cd .. \
    && cd product-service && ../mvnw clean package -DskipTests && cd .. \
    && cd inventory-service && ../mvnw clean package -DskipTests && cd ..

# ==========================================
# STAGE 2: Build Vite React Dashboard Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /ui

COPY resilience-dashboard-ui/package*.json ./
RUN npm install

COPY resilience-dashboard-ui/ ./
RUN npm run build

# ==========================================
# STAGE 3: Final Production Cluster Image
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install Node.js runtime for orchestrator & UI static serving
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Root Orchestrator files
COPY package.json service-orchestrator.js ./

# Copy built JARs to their respective directories
COPY --from=backend-builder /workspace/target /app/target
COPY --from=backend-builder /workspace/Eureka-server/target /app/Eureka-server/target
COPY --from=backend-builder /workspace/api-Gateway/target /app/api-Gateway/target
COPY --from=backend-builder /workspace/product-service/target /app/product-service/target
COPY --from=backend-builder /workspace/inventory-service/target /app/inventory-service/target

# Copy built frontend UI
COPY --from=frontend-builder /ui /app/resilience-dashboard-ui

# Railway environment default port
ENV PORT=5173
ENV DOCKER=true
ENV SPRING_PROFILES_ACTIVE=prod

# Expose UI and Gateway ports
EXPOSE 5173 8080

# Start unified cluster orchestrator
CMD ["node", "service-orchestrator.js"]
