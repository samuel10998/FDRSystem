FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY . .
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk add --no-cache wget

COPY --from=builder /app/target/*.war ./app.war
RUN mkdir -p /app/uploads/avatars

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.war"]
