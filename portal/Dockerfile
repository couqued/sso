# Stage 1: React build
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

# Stage 2: Spring Boot build
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app
COPY pom.xml .
RUN mkdir -p src/main/resources/static
COPY src/main/ ./src/main/
# Copy React build output into Spring Boot static resources
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static/

# Download wrapper or use system maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
RUN mvn package -DskipTests

# Stage 3: Runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
