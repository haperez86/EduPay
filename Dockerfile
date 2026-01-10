# syntax=docker/dockerfile:1

# Stage 1: Build (Maven builds frontend + backend)
FROM eclipse-temurin:17-jdk AS build

WORKDIR /workspace

# Copy both projects
COPY control-pagos/ ./control-pagos/
COPY payment-portal-pro/ ./payment-portal-pro/

# Generate package-lock.json if missing (npm ci requires it)
WORKDIR /workspace/payment-portal-pro
RUN apt-get update && apt-get install -y nodejs npm && \
    npm install --package-lock-only

# Build with Maven (includes frontend via frontend-maven-plugin)
WORKDIR /workspace
RUN chmod +x ./control-pagos/mvnw
RUN ./control-pagos/mvnw -f control-pagos/pom.xml clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /workspace/control-pagos/target/control-pagos-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

CMD ["java", "-jar", "/app/app.jar"]
