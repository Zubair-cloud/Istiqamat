import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The block we want to replace
old_block = """        window.onload = () => {
            loadData();
            if (new Date(appData.currentDate) > new Date(appData.lastLoginDate)) {
                checkMissedDays(appData.lastLoginDate, appData.currentDate);
            }
            // Init Journal Date
            document.getElementById('journal-date-input').value = appData.currentDate;
            renderAll();
        };"""

# The new corrected block
new_block = """        window.onload = () => {
            loadData();
            
            // FIX: Check against real system date
            const today = new Date().toISOString().split('T')[0];
            if (appData.currentDate !== today) {
                console.log("New Day Detected:", today);
                // Check for missed days since the last recorded date
                checkMissedDays(appData.currentDate, today);
                
                // Update dates to today
                appData.currentDate = today;
                appData.lastLoginDate = today;
                saveData();
            }

            // Init Journal Date
            document.getElementById('journal-date-input').value = appData.currentDate;
            renderAll();
            
            // Sync with Android Widget immediately
            if (window.Android && window.Android.syncData) {
                window.Android.syncData(JSON.stringify(appData));
            }
        };"""

if old_block in content:
    new_content = content.replace(old_block, new_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully fixed date rollover logic.")
else:
    print("Could not find exact window.onload block. Trying fuzzy match or manual intervention needed.")
    # Fallback: simpler match if indentation differs
    # This is a simple script, if it fails I will read the file again to check indentation.
