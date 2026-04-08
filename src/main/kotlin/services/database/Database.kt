package com.kitledger.services.database

import com.kitledger.services.config.Config
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.v1.jdbc.Database

/**
 * Creates a database connection.
 * @return the database connection.
 */
object DatabaseFactory {
    fun init() {
        val config = Config.db
        val hikariConfig = HikariConfig().apply {
            jdbcUrl = config.url
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = config.maxConnections
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
        }

        val dataSource = HikariDataSource(hikariConfig)
        Database.connect(dataSource)
    }
}