package com.jubbu.istiqamat

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

class IstiqamatWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisAppWidget = ComponentName(context.packageName, IstiqamatWidget::class.java.name)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisAppWidget)
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_list)
        }
        
        // Handle click on habit item
        if (intent.getAction() == "toggle_habit") {
            val habitId = intent.getIntExtra("habitId", -1)
            if (habitId != -1) {
                // Open app to toggle
                // Ideally we would toggle in background, but we need JS engine.
                // So we launch MainActivity and pass an extra to toggle immediately.
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("toggleHabitId", habitId)
                }
                context.startActivity(launchIntent)
            }
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_istiqamat)

            // Set up the collection
            val intent = Intent(context, WidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            
            views.setRemoteAdapter(R.id.widget_list, intent)
            views.setEmptyView(R.id.widget_list, R.id.widget_empty)

            // Set up pending intent for template
            val toastIntent = Intent(context, IstiqamatWidget::class.java).apply {
                action = "toggle_habit"
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            val toastPendingIntent = PendingIntent.getBroadcast(
                context, 
                0, 
                toastIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_list, toastPendingIntent)
            
            // Refresh button
            val refreshIntent = Intent(context, IstiqamatWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            }
            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                1,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_refresh, refreshPendingIntent)
            
            // Open App on Title Click
            val appIntent = Intent(context, MainActivity::class.java)
            val appPendingIntent = PendingIntent.getActivity(
                context, 2, appIntent, PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_title, appPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_icon, appPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
