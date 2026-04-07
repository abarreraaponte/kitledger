@file:OptIn(ExperimentalTime::class)

package com.kitledger.domain.auth

import com.kitledger.services.database.SessionsTable
import kotlinx.coroutines.flow.firstOrNull
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.select
import java.util.UUID
import kotlin.time.ExperimentalTime

/**
 * Retrieves the userId associated with a session.
 * @param sessionId the session ID.
 * @return the user ID, or null if the session does not exist.
 */
suspend fun getSessionUserId(sessionId: UUID): UUID? {
    val sessionResult = SessionsTable.select(SessionsTable.userId)
        .where { SessionsTable.id eq sessionId }
        .firstOrNull()

    val userId = sessionResult?.get(SessionsTable.userId)

    return userId
}

/**
 * Converts a result row to a session.
 */
fun ResultRow.toSession(): Session {
    return Session(
        id = this[SessionsTable.id],
        userId = this[SessionsTable.userId],
        createdAt = this[SessionsTable.createdAt],
        expiresAt = this[SessionsTable.expiresAt],
    )
}

