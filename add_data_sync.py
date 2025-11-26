import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
sync_added = False

for line in lines:
    if 'localStorage.setItem(\'istiqamat_data_v3\', JSON.stringify(appData));' in line and not sync_added:
        new_lines.append(line)
        new_lines.append('            if (window.Android && window.Android.syncData) {\n')
        new_lines.append('                window.Android.syncData(JSON.stringify(appData));\n')
        new_lines.append('            }\n')
        sync_added = True
        print("Added syncData call")
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
