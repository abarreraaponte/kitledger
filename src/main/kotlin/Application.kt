package com.kitledger

import com.kitledger.services.cli.execute
import com.kitledger.services.config.AppConfig
import com.kitledger.services.config.Config
import com.kitledger.services.database.DatabaseFactory
import com.kitledger.services.database.Migration
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*

suspend fun main(args: Array<String>) {

    /**
     * Run the database migrations
     */
    Migration.run()

    /**
     * Initialize the database connection
     */
    DatabaseFactory.init()

    if (args.isEmpty() || args[0] == "serve") {
        // Start the server
        embeddedServer(Netty, port = Config.server.port, host = "0.0.0.0") {
            module(Config)
        }.start(wait = true)
    } else {
        execute(args)
    }
}

/**
 * Extension function for the main Module
 * @param config the application configuration
 * @receiver Application
 */
fun Application.module(config: AppConfig) {
    configureRouting()
}
