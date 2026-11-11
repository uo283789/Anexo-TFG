package com.example.fsleepsync

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences("auth", MODE_PRIVATE)

        // Si ya hay token, saltar a MainActivity
        if (prefs.getString("token", null) != null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_login)

        Log.d("LOGIN", "Layout cargado")

        val emailEdit = findViewById<EditText>(R.id.emailEdit)
        val passwordEdit = findViewById<EditText>(R.id.passwordEdit)
        val loginButton = findViewById<Button>(R.id.loginButton)

        Log.d("LOGIN", "Views cargadas")

        loginButton.setOnClickListener {

            val email = emailEdit.text.toString().trim()
            val password = passwordEdit.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Log.e("LOGIN", "Campos vacíos")
                return@setOnClickListener
            }

            hacerLogin(email, password)
        }
    }

    private fun hacerLogin(email: String, password: String) {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val client = OkHttpClient()
                val json = """
{
    "email": "$email",
    "password": "$password"
}
                """.trimIndent()
                val body = json.toRequestBody(
                    "application/json".toMediaType()
                )
                val request = Request.Builder()
                    .url("https://unfully-palaestric-corliss.ngrok-free.dev/login")
                    .post(body)
                    .build()
                val response = client.newCall(request).execute()
                val responseBody = response.body?.string() ?: ""
                Log.d("LOGIN", "Código: ${response.code}")
                Log.d("LOGIN", "Respuesta: $responseBody")
                if (response.isSuccessful) {
                    val token = JSONObject(responseBody).getString("token")
                    getSharedPreferences("auth", MODE_PRIVATE)
                        .edit()
                        .putString("token", token)
                        .apply()
                    runOnUiThread {
                        startActivity(
                            Intent(this@LoginActivity, MainActivity::class.java)
                        )
                        finish()
                    }
                } else {
                    Log.e("LOGIN", "Login incorrecto")
                }
            } catch (e: Exception) {
                Log.e("LOGIN", "Error haciendo login", e)
            }
        }
    }
}