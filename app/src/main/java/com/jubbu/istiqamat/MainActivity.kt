package com.jubbu.istiqamat

import android.annotation.SuppressLint
import android.os.Bundle
import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import android.net.Uri
import android.webkit.ValueCallback
import androidx.appcompat.app.AppCompatActivity
import android.net.Uri
import android.webkit.ValueCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import android.view.View

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var notificationHelper: NotificationHelper
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

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

        // Enable Edge-to-Edge and Handle Insets
        WindowCompat.setDecorFitsSystemWindows(window, false)
        findViewById<View>(android.R.id.content).setOnApplyWindowInsetsListener { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.updatePadding(
                left = bars.left,
                top = bars.top,
                right = bars.right,
                bottom = bars.bottom
            )
            WindowInsetsCompat.CONSUMED
        }

        notificationHelper = NotificationHelper(this)

        webView = findViewById(R.id.webView)

        // WebView Settings (Engine Tuning) 🔧
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.webViewClient = WebViewClient()
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
                val habitId = it.getIntExtra("toggleHabitId", -1)
                if (habitId != -1) {
                    // Delay slightly to ensure WebView is ready if cold start
                    webView.postDelayed({
                        webView.evaluateJavascript("handleHabitClick($habitId);", null)
                    }, 1000)
                }
            }
        }
    }

    // JavaScript Interface
    inner class WebAppInterface {
        @JavascriptInterface
        fun getCurrentTab(): String {
            return "home"
        }

        @JavascriptInterface
        fun scheduleHabit(id: Int, title: String, time: String, daysJson: String, message: String) {
            try {
                val parts = time.split(":")
                val hour = parts[0].toInt()
                val minute = parts[1].toInt()
                
                val jsonArray = org.json.JSONArray(daysJson)
                val days = IntArray(jsonArray.length())
                for (i in 0 until jsonArray.length()) {
                    days[i] = jsonArray.getInt(i)
                }
                
                notificationHelper.scheduleHabitNotification(id, title, message, hour, minute, days)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun cancelHabit(id: Int) {
            notificationHelper.cancelHabitNotification(id)
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