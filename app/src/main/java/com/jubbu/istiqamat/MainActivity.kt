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

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var notificationHelper: NotificationHelper

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

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
        webView.webChromeClient = WebChromeClient()

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
    }
}