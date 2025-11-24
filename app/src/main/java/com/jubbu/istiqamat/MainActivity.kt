package com.jubbu.istiqamat

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

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
    }

    // JavaScript Interface
    inner class WebAppInterface {
        @JavascriptInterface
        fun getCurrentTab(): String {
            return "home"
        }
    }
}