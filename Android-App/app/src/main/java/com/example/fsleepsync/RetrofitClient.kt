object RetrofitClient {

    private const val BASE_URL = "https://unfully-palaestric-corliss.ngrok-free.dev/"

    val api: ApiService by lazy {
        retrofit2.Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(
                retrofit2.converter.gson.GsonConverterFactory.create()
            )
            .build()
            .create(ApiService::class.java)
    }
}