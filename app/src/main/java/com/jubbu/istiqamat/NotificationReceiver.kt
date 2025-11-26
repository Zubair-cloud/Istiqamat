package com.jubbu.istiqamat

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlin.random.Random

class NotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notificationHelper = NotificationHelper(context)
        
        when (intent.action) {
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
            }
            
            NotificationHelper.NOTIFICATION_TYPE_EVENT -> {
                val eventId = intent.getIntExtra("eventId", 0)
                val eventTitle = intent.getStringExtra("eventTitle") ?: "Event Reminder"
                val reminderDays = intent.getIntExtra("reminderDays", 1)
                
                val message = when (reminderDays) {
                    0 -> "📅 Today is the day! $eventTitle"
                    1 -> "📅 Tomorrow: $eventTitle"
                    else -> "📅 In $reminderDays days: $eventTitle"
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
