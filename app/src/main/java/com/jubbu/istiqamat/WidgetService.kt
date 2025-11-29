package com.jubbu.istiqamat

import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return WidgetFactory(applicationContext)
    }
}

class WidgetFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {
    
    data class HabitItem(
        val id: Int,
        val title: String,
        val streak: Int,
        val isCompleted: Boolean,
        val type: String,
        val target: Int,
        val currentVal: Int
    )

    private val habitList = ArrayList<HabitItem>()

    override fun onCreate() {
        // Initial load
    }

    override fun onDataSetChanged() {
        habitList.clear()
        
        val prefs = context.getSharedPreferences("IstiqamatWidgetData", Context.MODE_PRIVATE)
        val jsonString = prefs.getString("appData", null) ?: return

        try {
            val appData = JSONObject(jsonString)
            val habits = appData.getJSONArray("habits")
            val habitLogs = appData.getJSONObject("habitLogs")
            // Always use real current date for widget display
            val currentDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

            for (i in 0 until habits.length()) {
                val h = habits.getJSONObject(i)
                val id = h.getInt("id")
                val title = h.getString("title")
                val streak = h.optInt("streak", 0)
                val type = h.getString("type")
                val target = h.optInt("target", 0)
                
                val logKey = "$currentDate-$id"
                var isCompleted = false
                var currentVal = 0
                
                if (habitLogs.has(logKey)) {
                    val log = habitLogs.getJSONObject(logKey)
                    isCompleted = log.optBoolean("completed", false)
                    currentVal = log.optInt("val", 0)
                }

                habitList.add(HabitItem(id, title, streak, isCompleted, type, target, currentVal))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        habitList.clear()
    }

    override fun getCount(): Int {
        return habitList.size
    }

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_item)
        
        if (position < habitList.size) {
            val item = habitList[position]
            
            views.setTextViewText(R.id.widget_item_title, item.title)
            views.setTextViewText(R.id.widget_item_streak, "🔥 ${item.streak} Days")
            
            // Icon logic (simplified for now, using generic star)
            // Ideally map "ph-mosque" to a drawable resource if available, or just use default
            
            if (item.isCompleted) {
                views.setImageViewResource(R.id.widget_item_check, R.drawable.ic_widget_checked)
                // No tint needed, drawable has colors
                views.setInt(R.id.widget_item_check, "setColorFilter", 0) 
                views.setInt(R.id.widget_item_title, "setPaintFlags", android.graphics.Paint.STRIKE_THRU_TEXT_FLAG or android.graphics.Paint.ANTI_ALIAS_FLAG)
                views.setTextColor(R.id.widget_item_title, 0xFFAAAAAA.toInt())
            } else {
                views.setImageViewResource(R.id.widget_item_check, R.drawable.ic_widget_unchecked)
                // No tint needed
                views.setInt(R.id.widget_item_check, "setColorFilter", 0)
                views.setInt(R.id.widget_item_title, "setPaintFlags", android.graphics.Paint.ANTI_ALIAS_FLAG)
                views.setTextColor(R.id.widget_item_title, 0xFFFFFFFF.toInt())
            }

            // Fill intent for click
            val fillInIntent = Intent().apply {
                putExtra("habitId", item.id)
                putExtra("action", "toggle")
            }
            views.setOnClickFillInIntent(R.id.widget_item_check, fillInIntent)
            // Also make the whole row clickable
            views.setOnClickFillInIntent(R.id.widget_item_title, fillInIntent)
        }
        
        return views
    }

    override fun getLoadingView(): RemoteViews? {
        return null
    }

    override fun getViewTypeCount(): Int {
        return 1
    }

    override fun getItemId(position: Int): Long {
        return position.toLong()
    }

    override fun hasStableIds(): Boolean {
        return true
    }
}
