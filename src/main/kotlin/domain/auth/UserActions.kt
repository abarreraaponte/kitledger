@file:OptIn(ExperimentalTime::class)

package com.kitledger.domain.auth

import com.kitledger.services.database.SystemPermissionsTable
import com.kitledger.services.database.UsersTable
import com.kitledger.services.utils.generateUuidV7
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction
import kotlin.random.Random
import kotlin.time.Clock
import kotlin.time.ExperimentalTime


/**
 * Creates a super user (System or Root User) with complete system permissions.
 * @param firstName the user's first name.
 * @param lastName the user's last name.
 * @param email the user's email.
 * @return a result type with the NewSuperUser object on success, or an exception on failure.
 */
suspend fun createSuperUser(firstName: String, lastName: String, email: String): Result<NewSuperUser> {

    try {
        val randomPassword = generateRandomPassword()

        if (randomPassword.isEmpty()) {
            throw RuntimeException("Failed to generate random password")
        }

        val hashedPassword = hashPassword(randomPassword)
        val userId = generateUuidV7()

        val superUser = suspendTransaction {
            val userResult = UsersTable.insert {
                it[UsersTable.id] = userId
                it[UsersTable.firstName] = firstName
                it[UsersTable.lastName] = lastName
                it[UsersTable.email] = email
                it[UsersTable.passwordHash] = hashedPassword
                it[UsersTable.createdAt] = Clock.System.now()
                it[UsersTable.updatedAt] = Clock.System.now()
            }

            val user = userResult.resultedValues?.get(0)?.toUser()
                ?: throw IllegalStateException("Failed to insert user")

            SystemPermissionsTable.insert {
                it[SystemPermissionsTable.id] = generateUuidV7()
                it[SystemPermissionsTable.permission] = SystemPermissionEnum.KL_SYSTEM_ADMIN
                it[SystemPermissionsTable.userId] = user.id
                it[SystemPermissionsTable.createdAt] = Clock.System.now()
                it[SystemPermissionsTable.updatedAt] = Clock.System.now()
            }

            val apiToken = createToken(userId) ?: throw IllegalStateException("Failed to create API token")
            val tokenId = apiToken.id

            val signedToken = signToken(TokenType.API, tokenId) ?: throw IllegalStateException("Failed to sign token")

            NewSuperUser(
                userId,
                firstName,
                lastName,
                email,
                randomPassword,
                signedToken
            )
        }

        return Result.success(superUser)
    } catch (e: Exception) {
        return Result.failure(e)
    }
}

/**
 * Generates a random password.
 * @param length the length of the password.
 * @return the password as a string.
 */
private fun generateRandomPassword(length: Int = 20): String {
    val charPool: List<Char> = ('a'..'z') + ('A'..'Z') + ('0'..'9') + "!@#$%^&*()_+-=".toList()

    val passwordBuilder = StringBuilder(length)

    for (i in 0 until length) {
        passwordBuilder.append(charPool[Random.nextInt(charPool.size)])
    }

    return passwordBuilder.toString()
}