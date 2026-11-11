import retrofit2.http.GET
import retrofit2.http.Header

interface ApiService {

    @GET("fitness/sleep")
    suspend fun getSleepData(
        @Header("Authorization") token: String
    ): SleepResponse
}