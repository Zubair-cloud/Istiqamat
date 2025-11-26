package com.jubbu.istiqamat

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Calendar

class NotificationHelper(private val context: Context) {
    
    companion object {
        const val CHANNEL_ID_HABITS = "habit_reminders"
        const val CHANNEL_ID_EVENTS = "event_reminders"
        const val CHANNEL_ID_STREAK = "streak_warnings"
        const val CHANNEL_ID_DAILY = "daily_check"
        
        const val NOTIFICATION_TYPE_HABIT = "habit"
        const val NOTIFICATION_TYPE_EVENT = "event"
        const val NOTIFICATION_TYPE_STREAK = "streak"
        const val NOTIFICATION_TYPE_DAILY = "daily_check"
        const val NOTIFICATION_TYPE_COUNTER = "counter"
        
        // Duolingo-style catchy messages
        val HABIT_MESSAGES = arrayOf(
            "Don't break your streak! 🔥",
            "Your daily dose of awesomeness awaits! ✨",
            "Time to level up! 💪",
            "Consistency is key! 🗝️",
            "Your future self will thank you! 🙏",
            "Make today count! 📈",
            "Small steps, big changes! 👣",
            "You've got this! 💯"
        )
        
        val STREAK_WARNING_MESSAGES = arrayOf(
            "Your streak needs you! Don't let it die! 🔥",
            "Psst... your habits are waiting! ⏰",
            "One day at a time! Keep it going! 💪",
            "Don't let today be the end of your streak! 🚫"
        )
        
        val COUNTER_INCOMPLETE_MESSAGES = arrayOf(
            "Almost there! Finish strong! 🎯",
            "You're so close! Don't give up now! 💪",
            "Just a little more to hit your goal! 🏆",
            "The finish line is near! Keep going! 🏁"
        )
    }
    
    init {
        createNotificationChannels()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val habitChannel = NotificationChannel(
                CHANNEL_ID_HABITS,
                "Habit Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for your daily habits"
                enableVibration(true)
                setShowBadge(true)
            }
            
            val eventChannel = NotificationChannel(
                CHANNEL_ID_EVENTS,
                "Event Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Reminders for upcoming events"
                enableVibration(true)
                setShowBadge(true)
            }
            
            val streakChannel = NotificationChannel(
                CHANNEL_ID_STREAK,
                "Streak Warnings",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Warnings when your streak is at risk"
                setShowBadge(true)
            }
            
            val dailyChannel = NotificationChannel(
                CHANNEL_ID_DAILY,
                "Daily Check-in",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Daily reminder to complete your habits"
                setShowBadge(true)
            }
            
            val notificationManager = context.getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(habitChannel)
            notificationManager.createNotificationChannel(eventChannel)
            notificationManager.createNotificationChannel(streakChannel)
            notificationManager.createNotificationChannel(dailyChannel)
        }
    }
    
    fun scheduleHabitNotification(
        habitId: Int,
        habitTitle: String,
        message: String,
        hour: Int,
        minute: Int,
        daysOfWeek: IntArray
    ) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        daysOfWeek.forEach { dayOfWeek ->
            val intent = Intent(context, NotificationReceiver::class.java).apply {
                action = NOTIFICATION_TYPE_HABIT
                putExtra("habitId", habitId)
                putExtra("habitTitle", habitTitle)
                putExtra("message", message)
            }
            
            val requestCode = habitId * 10 + dayOfWeek
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            val calendar = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.DAY_OF_WEEK, dayOfWeek + 1) // Calendar.SUNDAY = 1
                
                // If time has passed today, schedule for next week
                if (timeInMillis <= System.currentTimeMillis()) {
                    add(Calendar.WEEK_OF_YEAR, 1)
                }
            }
            
            // Schedule repeating alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }
        }
    }
    
    fun scheduleDailyCheck(hour: Int, minute: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        val intent = Intent(context, NotificationReceiver::class.java).apply {
            action = NOTIFICATION_TYPE_DAILY
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            998888, // Unique ID for daily check
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }
        
        alarmManager.setRepeating(
            AlarmManager.RTC_WAKEUP,
            calendar.timeInMillis,
            AlarmManager.INTERVAL_DAY,
            pendingIntent
        )
    }
    
    fun scheduleEventNotification(
        eventId: Int,
        eventTitle: String,
        eventDate: String,
        reminderDays: Int,
        hour: Int,
        minute: Int
    ) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        val intent = Intent(context, NotificationReceiver::class.java).apply {
            action = NOTIFICATION_TYPE_EVENT
            putExtra("eventId", eventId)
            putExtra("eventTitle", eventTitle)
            putExtra("reminderDays", reminderDays)
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            eventId + 100000, // Offset to avoid collision
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Parse event date and calculate reminder time
        val eventCalendar = Calendar.getInstance().apply {
            val parts = eventDate.split("-")
            set(Calendar.YEAR, parts[0].toInt())
            set(Calendar.MONTH, parts[1].toInt() - 1)
            set(Calendar.DAY_OF_MONTH, parts[2].toInt())
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            
            // Subtract reminder days
            add(Calendar.DAY_OF_YEAR, -reminderDays)
        }
        
        // Only schedule if in the future
        if (eventCalendar.timeInMillis > System.currentTimeMillis()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    eventCalendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    eventCalendar.timeInMillis,
                    pendingIntent
                )
            }
        }
    }
    
    fun scheduleStreakWarning(hour: Int, minute: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        val intent = Intent(context, NotificationReceiver::class.java).apply {
            action = NOTIFICATION_TYPE_STREAK
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            999999, // Unique ID for streak warning
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }
        
        alarmManager.setRepeating(
            AlarmManager.RTC_WAKEUP,
            calendar.timeInMillis,
            AlarmManager.INTERVAL_DAY,
            pendingIntent
        )
    }
    
    fun cancelHabitNotification(habitId: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        // Cancel for all days of week
        for (day in 0..6) {
            val intent = Intent(context, NotificationReceiver::class.java)
            val requestCode = habitId * 10 + day
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            
            pendingIntent?.let {
                alarmManager.cancel(it)
                it.cancel()
            }
        }
    }
    
    fun cancelEventNotification(eventId: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, NotificationReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            eventId + 100000,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        
        pendingIntent?.let {
            alarmManager.cancel(it)
            it.cancel()
        }
    }
    
    fun showNotification(
        notificationId: Int,
        title: String,
        message: String,
        channelId: String
    ) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        
        NotificationManagerCompat.from(context).notify(notificationId, notification)
    }
}
