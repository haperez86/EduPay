# syntax=docker/dockerfile:1

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY payment-portal-pro/package*.json ./
RUN npm ci

COPY payment-portal-pro/ ./
RUN npm run build

# Stage 2: Build Backend
FROM eclipse-temurin:17-jdk AS backend-build

WORKDIR /workspace

COPY control-pagos/ ./control-pagos/

# Copy frontend build to Spring Boot static resources
COPY --from=frontend-build /frontend/dist/ ./control-pagos/src/main/resources/static/

RUN chmod +x ./control-pagos/mvnw
RUN ./control-pagos/mvnw -f control-pagos/pom.xml clean package -DskipTests

# Stage 3: Runtime
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=backend-build /workspace/control-pagos/target/control-pagos-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

CMD ["java", "-jar", "/app/app.jar"]
