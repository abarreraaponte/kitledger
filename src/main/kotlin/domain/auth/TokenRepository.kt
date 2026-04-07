@file:OptIn(ExperimentalTime::class)

package com.kitledger.domain.auth

import com.kitledger.services.database.ApiTokensTable
import kotlinx.coroutines.flow.firstOrNull
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.select
import java.util.UUID
import kotlin.time.ExperimentalTime

/**
 * Retrieves the user id associated with a token.
 * @param token the token to identify.
 * @return the user id, or null if the token is invalid.
 */
suspend fun getTokenUserId(token: UUID): UUID? {
    val tokenResult = ApiTokensTable.select(ApiTokensTable.userId)
        .where { ApiTokensTable.id eq token }
        .firstOrNull()

    val userId = tokenResult?.get(ApiTokensTable.userId)

    return userId
}

/**
 * Converts a result row to an API token.
 */
fun ResultRow.toApiToken(): ApiToken {
    return ApiToken(
        id = this[ApiTokensTable.id],
        userId = this[ApiTokensTable.userId],
        name = this[ApiTokensTable.name],
        createdAt = this[ApiTokensTable.createdAt],
        revokedAt = this[ApiTokensTable.revokedAt],
    )
}