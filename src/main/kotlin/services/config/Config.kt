package com.kitledger.services.config

import com.sksamuel.hoplite.ConfigLoaderBuilder
import com.sksamuel.hoplite.addResourceSource

data class AuthConfig(val secret: String, val pastSecrets: List<String> = emptyList())
data class DbConfig(val url: String, val maxConnections: Int)
data class ServerConfig(val port: Int, val module: String)
data class SessionConfig(val ttl: Long)

data class CorsConfig(
    val origin: List<String>,
    private val additionalHeaders: List<String>,
    val maxAge: Long
) {
    val allowedHeaders = listOf("Content-Type", "Authorization", "X-Requested-With") + additionalHeaders
    val allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
}

data class AppConfig(
    val server: ServerConfig,
    val db: DbConfig,
    val auth: AuthConfig,
    val cors: CorsConfig,
    val session: SessionConfig
)

val Config = ConfigLoaderBuilder.default()
    .addResourceSource("/application.conf")
    .build()
    .loadConfigOrThrow<AppConfig>()