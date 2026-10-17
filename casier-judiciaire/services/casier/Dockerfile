# Service Casier : image d'exécution minimale, utilisateur non privilégié (SEC-04).
# Le JAR est construit au préalable : mvn -B verify (ou fourni dans le paquet d'installation).
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S casier && adduser -S casier -G casier
WORKDIR /app
COPY service-casier.jar /app/service-casier.jar
USER casier
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/service-casier.jar"]
