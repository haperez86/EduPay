# syntax=docker/dockerfile:1

FROM eclipse-temurin:17-jdk AS build

WORKDIR /workspace

COPY control-pagos/ ./control-pagos/
COPY payment-portal-pro/ ./payment-portal-pro/

RUN chmod +x ./control-pagos/mvnw
RUN ./control-pagos/mvnw -f control-pagos/pom.xml clean package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /workspace/control-pagos/target/control-pagos-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

CMD ["java", "-jar", "/app/app.jar"]
