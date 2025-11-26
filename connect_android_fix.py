import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
delete_habit_fixed = False
skip_next = False

for line in lines:
    if skip_next:
        skip_next = False
        continue

    # Target the specific line inside deleteHabit
    if 'if (confirm("Delete this habit?"))' in line and not delete_habit_fixed:
        new_lines.append('            if (confirm("Delete this habit?")) {\n')
        new_lines.append('                if (window.Android && window.Android.cancelHabit) {\n')
        new_lines.append('                    window.Android.cancelHabit(id);\n')
        new_lines.append('                }\n')
        new_lines.append('                appData.habits = appData.habits.filter(h => h.id !== id);\n')
        new_lines.append('                saveData();\n')
        new_lines.append('                renderAll();\n')
        new_lines.append('                showToast("Habit Deleted");\n')
        new_lines.append('            }\n')
        delete_habit_fixed = True
        print("Fixed deleteHabit logic")
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
