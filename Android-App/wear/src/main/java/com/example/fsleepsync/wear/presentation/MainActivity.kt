package com.example.fsleepsync.wear.presentation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlin.math.sqrt

private const val API_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJjYXJsb3NudWV2b0B0ZXN0LmNvbSIsImlhdCI6MTc3NjE4MjYxNCwiZXhwIjoxNzc2Nzg3NDE0fQ.TQy6vNgk1ThZ2n-Pes5yeBcZzMHKJnUgW_x1VT4dnow"

private const val SERVER_URL =
    "https://unfully-palaestric-corliss.ngrok-free.dev/wearable/upload"

class MainActivity : ComponentActivity(), SensorEventListener {

    //Variables principales
    private lateinit var sensorManager: SensorManager

    private var heartRateSensor: Sensor? = null
    private var accelerometerSensor: Sensor? = null

    private var currentHeartRate = 0f
    private var currentMovement = 0f

    //Permiso de sensores y si el usuario acepta, se inician
    private val permissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { granted ->
            if (granted) {
                Log.d("SLEEP", "Permiso BODY_SENSORS concedido")
                iniciarSensores()
            } else {
                Log.e("SLEEP", "Permiso BODY_SENSORS denegado")
            }
        }
    //Obtiene el sensor Manager y busca los sensores del dispositivo, si estan envia true sino false
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                Text("Leyendo sensores...")
            }
        }

        sensorManager =
            getSystemService(Context.SENSOR_SERVICE) as SensorManager

        heartRateSensor =
            sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE)

        accelerometerSensor =
            sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        Log.d(
            "SLEEP",
            "Heart sensor disponible: ${heartRateSensor != null}"
        )

        Log.d(
            "SLEEP",
            "Accelerometer disponible: ${accelerometerSensor != null}"
        )

        if (
            ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.BODY_SENSORS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            permissionLauncher.launch(Manifest.permission.BODY_SENSORS)
        } else {
            iniciarSensores()
        }
    }
    // Registra la actividad de los sensores
    private fun iniciarSensores() {

        heartRateSensor?.let {
            sensorManager.registerListener(
                this,
                it,
                SensorManager.SENSOR_DELAY_NORMAL
            )
        }

        accelerometerSensor?.let {
            sensorManager.registerListener(
                this,
                it,
                SensorManager.SENSOR_DELAY_NORMAL
            )
        }

        Log.d("SLEEP", "Sensores registrados")
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null) return

        when (event.sensor.type) {

            Sensor.TYPE_HEART_RATE -> {
                currentHeartRate = event.values[0]

                Log.d(
                    "SLEEP",
                    "Pulso actual: $currentHeartRate"
                )

                enviarServidor()
            }

            Sensor.TYPE_ACCELEROMETER -> {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]

                currentMovement = sqrt(x * x + y * y + z * z)

                Log.d(
                    "SLEEP",
                    "Movimiento actual: $currentMovement"
                )
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        Log.d(
            "SLEEP",
            "Accuracy sensor ${sensor?.type}: $accuracy"
        )
    }

    private fun enviarServidor() {
        try {
            val client = OkHttpClient()

            val json = """
{
    "heart_rate": $currentHeartRate,
    "movement": $currentMovement
}
            """.trimIndent()

            Log.d("SLEEP", "JSON enviado: $json")

            val body = json.toRequestBody(
                "application/json".toMediaType()
            )

            val request = Request.Builder()
                .url(SERVER_URL)
                .addHeader(
                    "Authorization",
                    "Bearer $API_TOKEN"
                )
                .post(body)
                .build()

            val response = client.newCall(request).execute()

            Log.d(
                "SLEEP",
                "Respuesta servidor: ${response.code}"
            )

            Log.d(
                "SLEEP",
                "Body servidor: ${response.body?.string()}"
            )

        } catch (e: Exception) {
            Log.e("SLEEP", "Error enviando al servidor", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        sensorManager.unregisterListener(this)
    }
}