package com.kitledger.domain.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import com.auth0.jwt.interfaces.DecodedJWT
import com.kitledger.services.config.Config
import java.util.*

/**
 * Encodes the information we normally need to put
 * in a JWT token.
 */
data class JwtPayload(
    val tokenType: TokenType,
    val tokenId: UUID,
)


/**
 * Signs a JWT token.
 * @param tokenType the type of token to sign.
 * @param tokenId the ID of the token to sign. This can represent also a Session ID, when the token type is Session.
 * @return the signed token, or null if it could not be signed.
 */
fun signToken(tokenType: TokenType, tokenId: UUID): String? {

    try {
        val currentSecret = Config.auth.secret
        val algorithm = Algorithm.HMAC256(currentSecret)
        val token = JWT.create()
            .withClaim("tokenType", tokenType.toString())
            .withClaim("tokenId", tokenId.toString())
            .sign(algorithm)

        return token
    } catch (e: Exception) {
        return null
    }
}

/**
 * Verifies a JWT token.
 * @param token the token to verify.
 * @return the decoded JWT payload, or null if the token is invalid.
 */
fun verifyToken(token: String): JwtPayload? {
    val allSecrets = listOf(Config.auth.secret) + Config.auth.pastSecrets

    val decodedJwt: DecodedJWT? = allSecrets.firstNotNullOfOrNull { secret ->
        try {
            val algorithm = Algorithm.HMAC256(secret)
            JWT.require(algorithm).build().verify(token)
        } catch (e: JWTVerificationException) {
            null
        }
    }

    if (decodedJwt == null) {
        return null
    }

    return try {
        val tokenId = decodedJwt.getClaim("tokenId").asString()
        val tokenType = decodedJwt.getClaim("tokenType").asString()

        if (tokenId == null || tokenType == null) {
            return null
        }

        JwtPayload(
            tokenId = UUID.fromString(tokenId),
            tokenType = TokenType.valueOf(tokenType)
        )
    } catch (e: Exception) {
        null
    }
}



