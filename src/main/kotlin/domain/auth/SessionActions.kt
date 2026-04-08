@file:OptIn(ExperimentalTime::class)

package com.kitledger.domain.auth

import com.kitledger.services.config.Config
import com.kitledger.services.database.SessionsTable
import com.kitledger.services.utils.generateUuidV7
import org.jetbrains.exposed.v1.jdbc.insert
import java.util.*
import kotlin.time.Clock
import kotlin.time.Duration.Companion.seconds
import kotlin.time.ExperimentalTime

/**
 * Starts a new session for a user.
 * @param userId the user ID.
 * @return the session, or null if it could not be started.
 */
suspend fun startSession(userId: UUID): Session? {

    try {
        val sessionConfig = Config.session
        val sessionId = generateUuidV7()
        val sessionResult = SessionsTable.insert {
            it[SessionsTable.id] = sessionId
            it[SessionsTable.userId] = userId
            it[createdAt] = Clock.System.now()
            it[expiresAt] = Clock.System.now().plus(sessionConfig.ttl.seconds)
        }

        val session = sessionResult.resultedValues?.get(0)?.toSession()

        return session
    } catch (e: Exception) {
        return null
    }
}