# Moshi uses reflection over Kotlin metadata for the reflective adapter.
-keep class kotlin.Metadata { *; }
-keepclassmembers class ** {
    @com.squareup.moshi.Json <fields>;
}
# Keep the DTOs used by Moshi reflection.
-keep class com.edhtracker.data.remote.** { *; }
