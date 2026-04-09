plugins {
    kotlin("jvm") version "2.3.20"
    kotlin("plugin.serialization") version "2.3.20"
    id("io.ktor.plugin") version "3.4.0"
}

group = "com.kitledger"
version = "0.0.1"

application {
    mainClass = "com.kitledger.ApplicationKt"
}

dependencies {
    // Ktor Server
    implementation("io.ktor:ktor-server-core-jvm")
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-status-pages")
    implementation("io.ktor:ktor-server-auth")
    implementation("io.ktor:ktor-server-cors")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")

    // Auth & Logging
    implementation("com.auth0:java-jwt:4.5.0")
    implementation("ch.qos.logback:logback-classic:1.5.13")

    // Database (Exposed + Flyway + Hikari)
    implementation("org.jetbrains.exposed:exposed-core:1.0.0-rc-4")
    implementation("org.jetbrains.exposed:exposed-jdbc:1.0.0-rc-4")
    implementation("org.jetbrains.exposed:exposed-json:1.0.0-rc-4")
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:1.0.0-rc-4")
    implementation("org.flywaydb:flyway-core:11.13.0")
    implementation("org.flywaydb:flyway-database-postgresql:11.13.0")
    implementation("com.zaxxer:HikariCP:7.0.2")
    implementation("org.postgresql:postgresql:42.7.7")

    // Utilities
    implementation("de.mkammerer:argon2-jvm:2.12")
    implementation("com.fasterxml.uuid:java-uuid-generator:5.1.0")
    implementation("io.konform:konform-jvm:0.11.1")

    // Config (Hoplite)
    implementation("com.sksamuel.hoplite:hoplite-core:3.0.0.RC3")
    implementation("com.sksamuel.hoplite:hoplite-hocon:3.0.0.RC3")

    // Testing
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:2.3.20")
}