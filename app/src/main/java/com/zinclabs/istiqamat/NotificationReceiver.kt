package com.zinclabs.istiqamat

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlin.random.Random

class NotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notificationHelper = NotificationHelper(context)
        
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON" -> {
                notificationHelper.rescheduleAllAlarms()
                return
            }
            
            NotificationHelper.NOTIFICATION_TYPE_HABIT -> {
                val habitId = intent.getIntExtra("habitId", 0)
                val habitTitle = intent.getStringExtra("habitTitle") ?: "Habit Reminder"
                val message = intent.getStringExtra("message") 
                    ?: NotificationHelper.HABIT_MESSAGES.random()
                
                notificationHelper.showNotification(
                    habitId,
                    habitTitle,
                    message,
                    NotificationHelper.CHANNEL_ID_HABITS
                )
                
                // Reschedule for next week
                val hour = intent.getIntExtra("hour", -1)
                val minute = intent.getIntExtra("minute", -1)
                val dayOfWeek = intent.getIntExtra("dayOfWeek", -1)
                if (hour != -1 && minute != -1 && dayOfWeek != -1) {
                    notificationHelper.scheduleHabitNotification(
                        habitId, habitTitle, message, hour, minute, intArrayOf(dayOfWeek)
                    )
                }
            }
            
            NotificationHelper.NOTIFICATION_TYPE_EVENT -> {
                val eventId = intent.getIntExtra("eventId", 0)
                val eventTitle = intent.getStringExtra("eventTitle") ?: "Event Reminder"
                val reminderMinutes = intent.getIntExtra("reminderMinutes", 0)
                
                val message = when (reminderMinutes) {
                    0 -> "📌 Starting now! $eventTitle"
                    else -> "⏳ In $reminderMinutes minutes: $eventTitle"
                }
                
                notificationHelper.showNotification(
                    eventId + 100000,
                    "Event Reminder",
                    message,
                    NotificationHelper.CHANNEL_ID_EVENTS
                )
            }
            
            NotificationHelper.NOTIFICATION_TYPE_STREAK -> {
                val message = NotificationHelper.STREAK_WARNING_MESSAGES.random()
                
                notificationHelper.showNotification(
                    999999,
                    "Streak Warning! 🔥",
                    message,
                    NotificationHelper.CHANNEL_ID_STREAK
                )
            }
            
            NotificationHelper.NOTIFICATION_TYPE_DAILY -> {
                notificationHelper.showNotification(
                    998888,
                    "Daily Check-in ✨",
                    "Have you completed all your habits today?",
                    NotificationHelper.CHANNEL_ID_DAILY
                )
            }
        }
    }
}
