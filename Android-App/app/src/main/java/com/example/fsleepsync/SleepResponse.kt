data class SleepResponse(
    val ok: Boolean,
    val duration: Int,
    val deep: Int,
    val light: Int,
    val rem: Int,
    val awake: Int,
    val heartRate: Int,
    val hasStages: Boolean
)