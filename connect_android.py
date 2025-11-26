import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
habit_update_added = False
habit_delete_replaced = False
event_add_added = False
event_delete_added = False
settings_update_added = False

for line in lines:
    # 1. saveEditHabit - Insert before showToast("Habit Updated!");
    if 'showToast("Habit Updated!");' in line and not habit_update_added:
        new_lines.append('                // Android Notification Sync\n')
        new_lines.append('                if (window.Android && window.Android.scheduleHabit) {\n')
        new_lines.append('                    if (h.notificationsEnabled && h.notificationTime) {\n')
        new_lines.append('                        window.Android.scheduleHabit(\n')
        new_lines.append('                            h.id,\n')
        new_lines.append('                            h.title,\n')
        new_lines.append('                            h.notificationTime,\n')
        new_lines.append('                            JSON.stringify(h.notificationDays || [0,1,2,3,4,5,6]),\n')
        new_lines.append('                            h.notificationMessage || "Time for your habit!"\n')
        new_lines.append('                        );\n')
        new_lines.append('                    } else {\n')
        new_lines.append('                        window.Android.cancelHabit(h.id);\n')
        new_lines.append('                    }\n')
        new_lines.append('                }\n')
        habit_update_added = True
        print("Added habit update logic")

    # 2. deleteHabit - Replace the one-liner
    if 'function deleteHabit(id) {' in line and 'if (confirm("Delete this habit?"))' in line:
        new_lines.append('        function deleteHabit(id) {\n')
        new_lines.append('            if (confirm("Delete this habit?")) {\n')
        new_lines.append('                if (window.Android && window.Android.cancelHabit) {\n')
        new_lines.append('                    window.Android.cancelHabit(id);\n')
        new_lines.append('                }\n')
        new_lines.append('                appData.habits = appData.habits.filter(h => h.id !== id);\n')
        new_lines.append('                saveData();\n')
        new_lines.append('                renderAll();\n')
        new_lines.append('                showToast("Habit Deleted");\n')
        new_lines.append('            }\n')
        new_lines.append('        }\n')
        habit_delete_replaced = True
        print("Replaced deleteHabit logic")
        continue # Skip original line

    # 3. addNewEvent - Insert before showToast("Event Added");
    if 'showToast("Event Added");' in line and not event_add_added:
        new_lines.append('            // Android Notification Sync\n')
        new_lines.append('            if (window.Android && window.Android.scheduleEvent) {\n')
        new_lines.append('                const newEvent = appData.events[appData.events.length-1];\n')
        new_lines.append('                window.Android.scheduleEvent(\n')
        new_lines.append('                    newEvent.id,\n')
        new_lines.append('                    newEvent.title,\n')
        new_lines.append('                    newEvent.date,\n')
        new_lines.append('                    newEvent.time,\n')
        new_lines.append('                    parseInt(newEvent.reminder)\n')
        new_lines.append('                );\n')
        new_lines.append('            }\n')
        event_add_added = True
        print("Added event add logic")

    # 4. deleteEvent - Insert before showToast("Event Deleted");
    if 'showToast("Event Deleted");' in line and not event_delete_added:
        new_lines.append('                if (window.Android && window.Android.cancelEvent) {\n')
        new_lines.append('                    window.Android.cancelEvent(appData.events[index].id);\n')
        new_lines.append('                }\n')
        event_delete_added = True
        print("Added event delete logic")

    # 5. saveGlobalSettings - Insert before showToast("Settings Saved");
    if 'showToast("Settings Saved");' in line and not settings_update_added:
        new_lines.append('            if (window.Android && window.Android.updateSettings) {\n')
        new_lines.append('                window.Android.updateSettings(\n')
        new_lines.append('                    appData.settings.dailyCheckTime,\n')
        new_lines.append('                    appData.settings.streakWarningTime,\n')
        new_lines.append('                    appData.settings.dailyCheckEnabled,\n')
        new_lines.append('                    appData.settings.streakWarningEnabled\n')
        new_lines.append('                );\n')
        new_lines.append('            }\n')
        settings_update_added = True
        print("Added settings update logic")

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
