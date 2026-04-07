package com.kitledger.services.database

import com.kitledger.services.config.AppConfig
import org.flywaydb.core.Flyway

/**
 * Runs database migrations.
 */
object Migration {
    fun run() {
        val config = AppConfig.dbConfig
        val jdbcUrl = config.url

        val flyway = Flyway.configure()
            .dataSource(jdbcUrl, null, null)
            .locations("classpath:db/migration")
            .table("schema_history")
            .load()

        flyway.migrate()

        println("Database migration finished.")
    }
}