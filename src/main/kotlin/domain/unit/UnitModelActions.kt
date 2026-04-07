@file:OptIn(ExperimentalTime::class)

package com.kitledger.domain.unit

import com.kitledger.services.database.UnitModelsTable
import com.kitledger.services.validation.toNativeValidationResult
import com.kitledger.services.utils.generateUuidV7
import com.kitledger.services.validation.ActionResult
import com.kitledger.services.validation.ValidationResult
import org.jetbrains.exposed.v1.exceptions.ExposedSQLException
import kotlin.time.Clock
import kotlin.time.ExperimentalTime
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction

suspend fun createUnitModel(data : UnitModelInsert) : ActionResult<UnitModel> {

    val validatedData = validateUnitModelInsert(data).toNativeValidationResult()

    if(validatedData is ValidationResult.Failure) {
        return ActionResult.ValidationFailure(validatedData.errors)
    }

    return try {
        val unitModel = suspendTransaction() {
            val insertResult = UnitModelsTable.insert {
                it[UnitModelsTable.id] = generateUuidV7()
                it[UnitModelsTable.refId] = data.refId
                it[UnitModelsTable.altId] = data.altId
                it[UnitModelsTable.name] = data.name
                it[UnitModelsTable.active] = data.active ?: true
                it[UnitModelsTable.createdAt]  = Clock.System.now()
                it[UnitModelsTable.updatedAt] = Clock.System.now()
            }

            insertResult.resultedValues?.get(0)?.toUnitModel()
                ?: throw IllegalStateException("Failed to insert unit model")
        }

        ActionResult.Success(unitModel)
    }

    catch(e: ExposedSQLException) {
        ActionResult.ActionFailure("Database error")
    }

    catch (e: Exception) {
        ActionResult.ActionFailure(e.message ?: "Unable to insert unit")
    }
}