@file:OptIn(ExperimentalTime::class)

package com.kitledger.domain.auth

import com.kitledger.services.database.ApiTokensTable
import com.kitledger.services.utils.generateUuidV7
import org.jetbrains.exposed.v1.jdbc.insert
import java.util.*
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

/**
 * Identifies the types of JWT tokens we use.
 */
enum class TokenType {
    API,
    SESSION
}

/**
 * Creates a new API token for a user.
 * @param userId the user ID.
 * @param name the name of the token.
 * @return the token, or null if it could not be created.
 */
suspend fun createToken(userId: UUID, name: String = "Api Token"): ApiToken? {

    try {
        val tokenId = generateUuidV7()

        val apiTokenResult = ApiTokensTable.insert {
            it[ApiTokensTable.id] = tokenId
            it[ApiTokensTable.userId] = userId
            it[ApiTokensTable.name] = name
            it[createdAt] = Clock.System.now()
        }

        val apiToken = apiTokenResult.resultedValues?.get(0)?.toApiToken()

        return apiToken
    } catch (e: Exception) {
        return null
    }
}