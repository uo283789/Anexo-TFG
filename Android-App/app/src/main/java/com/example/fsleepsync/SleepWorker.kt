package com.example.fsleepsync

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit

class SleepWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val token = applicationContext
                .getSharedPreferences("auth", Context.MODE_PRIVATE)
                .getString("token", null)
            if (token == null) {
                Log.d("WORKER", "No hay token")
                return Result.failure()
            }
            val status = HealthConnectClient.getSdkStatus(applicationContext)
            if (status != HealthConnectClient.SDK_AVAILABLE) {
                Log.d("WORKER", "Health Connect no disponible")
                return Result.retry()
            }
            val healthConnectClient =
                HealthConnectClient.getOrCreate(applicationContext)
            val fin = Instant.now()
            val inicio = fin.minus(7, ChronoUnit.DAYS)
            val response = healthConnectClient.readRecords(
                ReadRecordsRequest(
                    SleepSessionRecord::class,
                    TimeRangeFilter.between(inicio, fin)
                )
            )
            val sesionesSamsung = response.records.filter {
                val paquete = it.metadata.dataOrigin.packageName ?: ""
                paquete.contains("shealth", ignoreCase = true)
            }
            if (sesionesSamsung.isEmpty()) {
                Log.d("WORKER", "No hay sesiones Samsung")
                return Result.success()
            }
            val ultima = sesionesSamsung
                .sortedByDescending { it.endTime }
                .first()

            var deepSleep = 0L
            var lightSleep = 0L
            var remSleep = 0L
            var awakeTime = 0L
            for (stage in ultima.stages) {

                val minutos = Duration.between(
                    stage.startTime,
                    stage.endTime
                ).toMinutes()

                when (stage.stage) {
                    1 -> awakeTime += minutos
                    4 -> lightSleep += minutos
                    5 -> deepSleep += minutos
                    6 -> remSleep += minutos
                }
            }
            val hrResponse = healthConnectClient.readRecords(
                ReadRecordsRequest(
                    HeartRateRecord::class,
                    TimeRangeFilter.between(
                        ultima.startTime,
                        ultima.endTime
                    )
                )
            )
            var suma = 0.0
            var total = 0
            for (record in hrResponse.records) {
                for (sample in record.samples) {
                    suma += sample.beatsPerMinute
                    total++
                }
            }
            val heartRateAvg =
                if (total > 0) {
                    (suma / total).toInt()
                } else {
                    0
                }

            val fecha = ultima.startTime
                .atZone(ZoneId.systemDefault())
                .toLocalDate()

            val json = """
{
    "date": "$fecha",
    "deep_sleep": $deepSleep,
    "light_sleep": $lightSleep,
    "rem_sleep": $remSleep,
    "awake_time": $awakeTime,
    "heart_rate_avg": $heartRateAvg
}
            """.trimIndent()

            Log.d("WORKER", "JSON enviado: $json")

            val body = json.toRequestBody(
                "application/json".toMediaType()
            )

            val request = Request.Builder()
                .url("https://unfully-palaestric-corliss.ngrok-free.dev/wearable/upload")
                .addHeader("Authorization", "Bearer $token")
                .post(body)
                .build()

            val client = OkHttpClient()
            val responseServer = client.newCall(request).execute()

            Log.d("WORKER", "Respuesta: ${responseServer.code}")

            if (responseServer.code == 401) {
                applicationContext
                    .getSharedPreferences("auth", Context.MODE_PRIVATE)
                    .edit()
                    .remove("token")
                    .apply()

                val intent = Intent(applicationContext, LoginActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                applicationContext.startActivity(intent)

                return Result.failure()
            }

            Result.success()

        } catch (e: Exception) {
            Log.e("WORKER", "Error", e)
            Result.retry()
        }
    }
}