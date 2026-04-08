val argon2JvmVersion: String by project
val auth0JwtVersion: String by project
val exposedVersion: String by project
val flywayVersion: String by project
val hikaricpVersion: String by project
val hopliteVersion: String by project
val jdbcPostgresDriverVersion: String by project
val konformVersion: String by project
val kotlinVersion: String by project
val logbackVersion: String by project
val postgresDriverVersion: String by project
val uuidGeneratorVersion: String by project

plugins {
    kotlin("jvm") version "2.2.20"
    kotlin("plugin.serialization") version "2.2.20"
    id("io.ktor.plugin") version "3.3.0"
}

group = "com.kitledger"
version = "0.0.1"

application {
    mainClass = "com.kitledger.ApplicationKt"
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm")
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-status-pages")
    implementation("io.ktor:ktor-server-auth")
    implementation("io.ktor:ktor-server-core")
    implementation("io.ktor:ktor-server-config-yaml")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")
    implementation("com.auth0:java-jwt:$auth0JwtVersion")
    implementation("ch.qos.logback:logback-classic:$logbackVersion")
    implementation("org.jetbrains.exposed:exposed-core:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-jdbc:${exposedVersion}")
    implementation("org.jetbrains.exposed:exposed-json:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:$exposedVersion")
    implementation("org.flywaydb:flyway-core:$flywayVersion")
    implementation("org.flywaydb:flyway-database-postgresql:$flywayVersion")
    implementation("com.zaxxer:HikariCP:${hikaricpVersion}")
    implementation("org.postgresql:postgresql:${postgresDriverVersion}")
    implementation("org.postgresql:postgresql:${jdbcPostgresDriverVersion}")
    implementation("de.mkammerer:argon2-jvm:$argon2JvmVersion")
    implementation("com.fasterxml.uuid:java-uuid-generator:$uuidGeneratorVersion")
    implementation("io.konform:konform-jvm:$konformVersion")
    implementation("com.sksamuel.hoplite:hoplite-core:$hopliteVersion")
    implementation("com.sksamuel.hoplite:hoplite-hocon:$hopliteVersion")
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:$kotlinVersion")
}
