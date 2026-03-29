package com.zinclabs.istiqamat

import android.annotation.SuppressLint
import android.os.Bundle
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.ValueCallback
import android.widget.Toast
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.view.View
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.OnUserEarnedRewardListener
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.SetOptions
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var googleSignInClient: GoogleSignInClient
    private var pendingHabitIdToToggle: Long = -1L

    private val signInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                firebaseAuthWithGoogle(account.idToken!!)
            } catch (e: ApiException) {
                Log.w("MainActivity", "Google sign in failed", e)
                Toast.makeText(this, "Sign in failed.", Toast.LENGTH_SHORT).show()
            }
        }
    }
    private lateinit var webView: WebView
    private lateinit var notificationHelper: NotificationHelper
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    // AdMob Rewarded Ad variables
    private var rewardedAd: RewardedAd? = null
    // Use a test ad unit ID for development
    private val AD_UNIT_ID = "ca-app-pub-9699861906304785/6273892518"
    private var isLoadingAd = false

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            result.data?.data?.let { uri ->
                fileUploadCallback?.onReceiveValue(arrayOf(uri))
            } ?: run {
                fileUploadCallback?.onReceiveValue(null)
            }
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // Initialize Mobile Ads SDK
        MobileAds.initialize(this) {}
        loadRewardedAd()

        triggerSignInIfNeeded(false)

        notificationHelper = NotificationHelper(this)

        webView = findViewById(R.id.webView)
        
        // Request Notification Permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        // WebView Settings (Engine Tuning) 🔧
        webView.setBackgroundColor(android.graphics.Color.parseColor("#050816"))
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                if (pendingHabitIdToToggle != -1L) {
                    view?.evaluateJavascript("handleHabitClick($pendingHabitIdToToggle);", null)
                    pendingHabitIdToToggle = -1L
                }
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "application/json" // Limit to JSON
                }
                fileChooserLauncher.launch(intent)
                return true
            }
        }

        // Add JavaScript interface for tab detection
        webView.addJavascriptInterface(WebAppInterface(), "Android")

        // Load the HTML File
        webView.loadUrl("file:///android_asset/index.html")

        // Modern back button handling
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // Check current tab via JavaScript
                webView.evaluateJavascript(
                    "(function() { " +
                    "  const homeScreen = document.getElementById('home-screen'); " +
                    "  return homeScreen && homeScreen.classList.contains('active') ? 'home' : 'other'; " +
                    "})();"
                ) { result ->
                    when (result?.replace("\"", "")) {
                        "home" -> {
                            // On home screen, exit app
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                        }
                        else -> {
                            // Not on home, navigate to home tab
                            webView.evaluateJavascript(
                                "switchTab('home', document.querySelector('.nav-item.active'));",
                                null
                            )
                        }
                    }
                }
            }
        })

        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        intent?.let {
            if (it.hasExtra("toggleHabitId")) {
                val habitId = it.getLongExtra("toggleHabitId", -1L)
                if (habitId != -1L) {
                    if (webView.progress == 100) {
                        webView.evaluateJavascript("handleHabitClick($habitId);", null)
                    } else {
                        pendingHabitIdToToggle = habitId
                    }
                }
            }
        }
    }

    // AdMob Logic
    private var adLoadRetryCount = 0
    private fun loadRewardedAd() {
        if (rewardedAd == null && !isLoadingAd) {
            isLoadingAd = true
            var adRequest = AdRequest.Builder().build()
            RewardedAd.load(this, AD_UNIT_ID, adRequest, object : RewardedAdLoadCallback() {
                override fun onAdFailedToLoad(adError: LoadAdError) {
                    rewardedAd = null
                    isLoadingAd = false
                    
                    // Exponential backoff retry logic (up to 3 retries)
                    if (adLoadRetryCount < 3) {
                        adLoadRetryCount++
                        val retryDelayMillis = (Math.pow(2.0, adLoadRetryCount.toDouble()) * 15000).toLong() // 30s, 60s, 120s
                        webView.postDelayed({ loadRewardedAd() }, retryDelayMillis)
                    }
                }

                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    isLoadingAd = false
                    adLoadRetryCount = 0 // Reset on success
                }
            })
        }
    }

    private fun showRewardedAd() {
        // Hard native-side limit: max 2 ads per day
        val prefs = getSharedPreferences("IstiqamatAdLimit", Context.MODE_PRIVATE)
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val savedDate = prefs.getString("adDate", "")
        var adCount = prefs.getInt("adCount", 0)
        if (savedDate != today) {
            adCount = 0
            prefs.edit().putString("adDate", today).putInt("adCount", 0).apply()
        }
        if (adCount >= 2) {
            Toast.makeText(this, "Daily Ad Limit Reached!", Toast.LENGTH_SHORT).show()
            return
        }

        if (rewardedAd != null) {
            rewardedAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    rewardedAd = null
                    loadRewardedAd()
                }
                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    rewardedAd = null
                    loadRewardedAd()
                }
            }
            rewardedAd?.show(this, OnUserEarnedRewardListener { rewardItem ->
                // Increment native ad counter
                prefs.edit().putInt("adCount", adCount + 1).apply()
                // Handle the reward securely in native code.
                applySecureAdReward()
            })
        } else {
            Toast.makeText(this, "Ad not ready yet. Try again in a moment.", Toast.LENGTH_SHORT).show()
             if (!isLoadingAd) {
                loadRewardedAd()
            }
        }
    }

    private fun applySecureAdReward() {
        val uid = auth.currentUser?.uid
        if (uid == null) {
            Toast.makeText(this, "Not logged in!", Toast.LENGTH_SHORT).show()
            return
        }
        val userRef = db.collection("users").document(uid)
        val updates = hashMapOf<String, Any>(
            "daily_ad_count" to FieldValue.increment(1),
            "last_ad_timestamp" to FieldValue.serverTimestamp()
        )
        userRef.update(updates).addOnSuccessListener {
            runOnUiThread {
                webView.evaluateJavascript("if(window.onSecureAdRewardSuccess) window.onSecureAdRewardSuccess(20);", null)
            }
        }.addOnFailureListener { e ->
            Log.e("MainActivity", "Ad Rule Rejected", e)
            runOnUiThread { Toast.makeText(this, "Ad Sync Rejected by Server", Toast.LENGTH_SHORT).show() }
        }
    }

    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    val user = auth.currentUser
                    syncUserWithFirestore(user?.uid, user?.email)
                } else {
                    Toast.makeText(this, "Authentication Failed.", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun syncUserWithFirestore(uid: String?, email: String?) {
        if (uid == null) return
        val userRef = db.collection("users").document(uid)
        
        userRef.get().addOnSuccessListener { document ->
            if (document.exists()) {
                Toast.makeText(this, "Welcome back!", Toast.LENGTH_SHORT).show()
                val data = document.data ?: return@addOnSuccessListener
                val jsonStr = org.json.JSONObject(data).toString()
                    .replace("\\", "\\\\")
                    .replace("'", "\\'")
                runOnUiThread {
                    webView.evaluateJavascript("if(window.updateFromCloud) window.updateFromCloud('$jsonStr');", null)
                }
            } else {
                val newUser = hashMapOf<String, Any>(
                    "email" to (email ?: ""),
                    "points" to 0,
                    "streak" to 0,
                    "special_coins" to 0,
                    "shields" to 0,
                    "daily_ad_count" to 0
                )
                userRef.set(newUser).addOnSuccessListener {
                    val jsonStr = org.json.JSONObject(newUser).toString()
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                    runOnUiThread {
                        webView.evaluateJavascript("if(window.updateFromCloud) window.updateFromCloud('$jsonStr');", null)
                    }
                }
                Toast.makeText(this, "Account Created!", Toast.LENGTH_SHORT).show()
            }
        }.addOnFailureListener { e ->
            Log.w("MainActivity", "Error fetching document", e)
        }
    }

    private fun triggerSignInIfNeeded(force: Boolean = false) {
        if (auth.currentUser == null) {
            if (force) {
                val signInIntent = googleSignInClient.signInIntent
                signInLauncher.launch(signInIntent)
            }
        } else {
            syncUserWithFirestore(auth.currentUser?.uid, auth.currentUser?.email)
        }
    }

    // JavaScript Interface

    inner class WebAppInterface {

        @JavascriptInterface
        fun triggerSignIn() {
            runOnUiThread {
                this@MainActivity.triggerSignInIfNeeded(true)
            }
        }

        @JavascriptInterface
        fun uploadDailySync(pointsEarned: Int, newTotalPoints: Int, habitsCompleted: Int, currentStreak: Int) {
            val uid = auth.currentUser?.uid ?: return
            val userRef = db.collection("users").document(uid)
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            val dateStr = sdf.format(java.util.Date())

            val historyEntry = hashMapOf(
                "date" to dateStr,
                "habits_completed" to habitsCompleted,
                "points_earned" to pointsEarned
            )
            val updates = hashMapOf<String, Any>(
                "points" to FieldValue.increment(pointsEarned.toLong()),
                "streak" to currentStreak,
                "analytics_history" to FieldValue.arrayUnion(historyEntry)
            )
            userRef.update(updates)
        }



        @JavascriptInterface
        fun showRewardedAd() {
            runOnUiThread {
                this@MainActivity.showRewardedAd()
            }
        }

        @JavascriptInterface
        fun scheduleHabit(id: Long, title: String, time: String, daysJson: String, message: String) {
            try {
                val parts = time.split(":")
                val hour = parts[0].toInt()
                val minute = parts[1].toInt()
                
                val jsonArray = org.json.JSONArray(daysJson)
                val days = IntArray(jsonArray.length())
                for (i in 0 until jsonArray.length()) {
                    days[i] = jsonArray.getInt(i)
                }
                
                val intId = (id % Int.MAX_VALUE).toInt()
                notificationHelper.scheduleHabitNotification(intId, title, message, hour, minute, days)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun cancelHabit(id: Long) {
            val intId = (id % Int.MAX_VALUE).toInt()
            notificationHelper.cancelHabitNotification(intId)
        }

        @JavascriptInterface
        fun scheduleEvent(id: Long, title: String, date: String, time: String, reminderMinutes: Int) {
            try {
                val parts = time.split(":")
                val hour = parts[0].toInt()
                val minute = parts[1].toInt()
                
                // Use hashcode or modulo for Int ID
                val intId = (id % Int.MAX_VALUE).toInt()
                
                notificationHelper.scheduleEventNotification(intId, title, date, reminderMinutes, hour, minute)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun cancelEvent(id: Long) {
            val intId = (id % Int.MAX_VALUE).toInt()
            notificationHelper.cancelEventNotification(intId)
        }

        @JavascriptInterface
        fun updateSettings(dailyTime: String, streakTime: String, dailyEnabled: Boolean, streakEnabled: Boolean) {
            try {
                if (dailyEnabled) {
                    val parts = dailyTime.split(":")
                    notificationHelper.scheduleDailyCheck(parts[0].toInt(), parts[1].toInt())
                }
                
                if (streakEnabled) {
                    val parts = streakTime.split(":")
                    notificationHelper.scheduleStreakWarning(parts[0].toInt(), parts[1].toInt())
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun syncData(jsonData: String) {
            val prefs = getSharedPreferences("IstiqamatWidgetData", Context.MODE_PRIVATE)
            prefs.edit().putString("appData", jsonData).apply()
            
            // Trigger widget update
            val intent = Intent(this@MainActivity, IstiqamatWidget::class.java).apply {
                action = android.appwidget.AppWidgetManager.ACTION_APPWIDGET_UPDATE
            }
            val ids = android.appwidget.AppWidgetManager.getInstance(application).getAppWidgetIds(
                android.content.ComponentName(application, IstiqamatWidget::class.java)
            )
            intent.putExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            sendBroadcast(intent)
        }

        @JavascriptInterface
        fun vibrate(duration: Int) {
            val v = getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(android.os.VibrationEffect.createOneShot(duration.toLong(), android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(duration.toLong())
            }
        }

        @JavascriptInterface
        fun backupData(jsonData: String) {
            try {
                val resolver = contentResolver
                val contentValues = android.content.ContentValues().apply {
                    put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, "istiqamat_backup_${System.currentTimeMillis()}.json")
                    put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/json")
                    put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                }
                
                val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                uri?.let {
                    resolver.openOutputStream(it)?.use { stream ->
                        stream.write(jsonData.toByteArray())
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}