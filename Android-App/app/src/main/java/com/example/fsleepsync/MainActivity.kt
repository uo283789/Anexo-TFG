package com.example.fsleepsync

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.util.concurrent.TimeUnit
//  GRÁFICO
import com.github.mikephil.charting.data.PieEntry
import com.github.mikephil.charting.data.PieDataSet
import com.github.mikephil.charting.data.PieData
import com.github.mikephil.charting.charts.PieChart
import com.github.mikephil.charting.formatter.ValueFormatter

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectClient: HealthConnectClient

    private val permissions = setOf(
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class)
    )

    private val requestPermissions =
        registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { granted ->

            if (granted.containsAll(permissions)) {
                leerSueno()
                iniciarWorker()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContentView(R.layout.activity_main)

        val token = getSharedPreferences("auth", MODE_PRIVATE)
            .getString("token", null)

        if (token == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        val status = HealthConnectClient.getSdkStatus(this)

        if (status != HealthConnectClient.SDK_AVAILABLE) {
            return
        }

        healthConnectClient = HealthConnectClient.getOrCreate(this)

        requestPermissions.launch(permissions)

        cargarGrafico()
    }

    private fun iniciarWorker() {
        val workRequest =
            PeriodicWorkRequestBuilder<SleepWorker>(1, TimeUnit.DAYS).build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "sleep_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
    }

    private fun leerSueno() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {

                val token = getSharedPreferences("auth", MODE_PRIVATE)
                    .getString("token", null) ?: return@launch

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
                    paquete.contains("shealth", true)
                }

                if (sesionesSamsung.isEmpty()) return@launch

                val ultima = sesionesSamsung.maxBy { it.endTime }

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

                val json = """
{
    "date": "${ultima.startTime.atZone(ZoneId.systemDefault()).toLocalDate()}",
    "deep_sleep": $deepSleep,
    "light_sleep": $lightSleep,
    "rem_sleep": $remSleep,
    "awake_time": $awakeTime,
    "heart_rate_avg": 0
}
                """.trimIndent()

                val client = OkHttpClient()

                val request = Request.Builder()
                    .url("https://unfully-palaestric-corliss.ngrok-free.dev/wearable/upload")
                    .addHeader("Authorization", "Bearer $token")
                    .post(json.toRequestBody("application/json".toMediaType()))
                    .build()

                client.newCall(request).execute()

            } catch (e: Exception) {
                Log.e("SLEEP", "Error", e)
            }
        }
    }

    //  CARGAR GRAFICO
    private fun cargarGrafico() {
        val pieChart = findViewById<PieChart>(R.id.pieChart)
        lifecycleScope.launch {
            try {
                val token = getSharedPreferences("auth", MODE_PRIVATE)
                    .getString("token", null) ?: return@launch

                val response = withContext(Dispatchers.IO) {
                    RetrofitClient.api.getSleepData("Bearer $token")
                }
                // TABLA
                findViewById<TextView>(R.id.txtDeepValue).text = "${response.deep} min"
                findViewById<TextView>(R.id.txtLightValue).text = "${response.light} min"
                findViewById<TextView>(R.id.txtRemValue).text = "${response.rem} min"
                findViewById<TextView>(R.id.txtAwakeValue).text = "${response.awake} min"
                val entries = listOf(
                    PieEntry(response.deep.toFloat(), "Profundo"),
                    PieEntry(response.light.toFloat(), "Ligero"),
                    PieEntry(response.rem.toFloat(), "REM"),
                    PieEntry(response.awake.toFloat(), "Despierto")
                )
                val dataSet = PieDataSet(entries, "")
                dataSet.colors = listOf(
                    android.graphics.Color.parseColor("#1E3A8A"),
                    android.graphics.Color.parseColor("#3B82F6"),
                    android.graphics.Color.parseColor("#8B5CF6"),
                    android.graphics.Color.parseColor("#F59E0B")
                )
                dataSet.valueTextSize = 16f
                dataSet.valueTextColor = android.graphics.Color.WHITE
                dataSet.sliceSpace = 3f
                val data = PieData(dataSet)
                //  FIX IMPORTANTE (sin lambda)
                data.setValueFormatter(object : ValueFormatter() {
                    override fun getFormattedValue(value: Float): String {
                        return "${value.toInt()} min"
                    }
                })

                pieChart.data = data
                pieChart.description.isEnabled = false
                pieChart.centerText = "Sueño"
                pieChart.setCenterTextSize(20f)
                pieChart.isDrawHoleEnabled = true
                pieChart.holeRadius = 60f
                pieChart.legend.isEnabled = false
                pieChart.setDrawEntryLabels(false)
                pieChart.animateY(1000)

                pieChart.invalidate()

                val txtTotalSleep = findViewById<TextView>(R.id.txtTotalSleep)

                val totalMin = response.deep + response.light + response.rem

                val horas = totalMin / 60.0

                val horasFormateadas = String.format("%.1f", horas)

                txtTotalSleep.text = "${horasFormateadas} h"

            } catch (e: Exception) {
                Log.e("GRAPH", "Error", e)
            }
        }
    }
}