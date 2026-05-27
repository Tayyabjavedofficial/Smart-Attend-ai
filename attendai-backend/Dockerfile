# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the AttendAI Spring Boot backend.
# Stage 1: warm up the Maven dependency cache, then compile and package.
# Stage 2: copy the runnable jar into a slim JRE image.
#
# Layer order is chosen so source-only changes don't bust the dependency cache.

# ----- Build stage -----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Resolve dependencies first - this layer only invalidates when pom.xml changes.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

# Now bring in source and build. Tests are skipped here because they need a
# DB; the CI pipeline / `mvn test` locally is the right place for those.
COPY src ./src
RUN mvn -B -q package -DskipTests
RUN ls -la /build/target/*.jar

# ----- Runtime stage -----
FROM eclipse-temurin:17-jre-jammy

# Drop privileges - never run a JVM as root in containers.
RUN groupadd --system attendai && useradd --system --gid attendai --create-home attendai
WORKDIR /app

# Use a wildcard so the produced *.jar is found regardless of its version.
COPY --from=build --chown=attendai:attendai /build/target/*.jar app.jar

USER attendai
EXPOSE 8080

# Sensible default JVM flags for a containerised service:
#  - MaxRAMPercentage uses the container's memory limit, not the host's
#  - +ExitOnOutOfMemoryError fail-fast so an orchestrator can restart us
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

HEALTHCHECK --interval=30s --timeout=4s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health 2>/dev/null \
        || wget -qO- http://localhost:8080/v3/api-docs 2>/dev/null \
        || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
