# Use Maven image for build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use smaller JRE image for runtime
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/kl-smartq-backend-java-1.0.0.jar app.jar

# Expose port (Render will override this with PORT env var)
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
