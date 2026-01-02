// --- APP INITIALIZATION & CONTROLLER LOGIC ---

window.onload = () => {
    loadData();
    if (new Date(appData.currentDate) > new Date(appData.lastLoginDate)) {
        checkMissedDays(appData.lastLoginDate, appData.currentDate);
    }
    // Init Journal Date
    const journalInput = document.getElementById('journal-date-input');
    if (journalInput) journalInput.value = appData.currentDate;
    
    renderAll();
};

// --- HABIT ACTIONS ---
function handleHabitClick(id) {
    const habit = appData.habits.find(h => h.id === id);
    const logKey = `${appData.currentDate}-${habit.id}`;
    if (!appData.habitLogs[logKey]) appData.habitLogs[logKey] = { completed: false, val: 0 };
    const dayLog = appData.habitLogs[logKey];

    if (habit.type === 'simple') {
        dayLog.completed = !dayLog.completed;
        if (dayLog.completed) {
            appData.user.points += 10; 
            habit.streak = (habit.streak || 0) + 1;
            addHistory(habit.title, 10); 
            showToast("Mashallah! +10 Points");
        } else {
            appData.user.points -= 10; 
            habit.streak = Math.max(0, (habit.streak || 0) - 1);
            addHistory(habit.title + " (Undone)", -10);
        }
    }
    else if (habit.type === 'counter') {
        if (dayLog.completed) { 
            dayLog.val = 0; 
            dayLog.completed = false; 
        } else {
            dayLog.val++;
            if (dayLog.val >= habit.target) {
                dayLog.val = habit.target; 
                dayLog.completed = true;
                appData.user.points += 20; 
                addHistory(habit.title + " Goal", 20); 
                showToast("Goal Reached! +20 Points 🔥");
            }
        }
    }
    saveData(); 
    renderAll();
}

function addNewHabit() {
    const name = document.getElementById('new-habit-name').value;
    const type = document.getElementById('new-habit-type').value;
    const target = document.getElementById('new-habit-target').value;
    const time = document.getElementById('new-habit-time').value;

    if (!name) return alert("Please enter a name");
    appData.habits.push({
        id: Date.now(),
        title: name,
        icon: "ph-star",
        type: type,
        streak: 0,
        target: type === 'counter' ? parseInt(target) : 0,
        time: time
    });
    saveData(); 
    closeAddModal(); 
    renderAll(); 
    showToast("New Habit Added!");
}

function saveEditHabit() {
    const id = parseInt(document.getElementById('edit-habit-id').value);
    const name = document.getElementById('edit-habit-name').value;
    const time = document.getElementById('edit-habit-time').value;
    const target = document.getElementById('edit-habit-target').value;

    const h = appData.habits.find(x => x.id === id);
    if (h) {
        h.title = name;
        h.time = time;
        if (h.type === 'counter') h.target = parseInt(target);
        saveData();
        renderAll();
        closeEditModal();
        showToast("Habit Updated!");
    }
}

function deleteHabit(id) {
    if (confirm("Delete this habit?")) { 
        appData.habits = appData.habits.filter(h => h.id !== id); 
        saveData(); 
        renderAll(); 
        showToast("Habit Deleted"); 
    }
}

// --- JOURNAL ACTIONS ---
// loadJournalEntry is now loadJournalEntryUI in ui.js to avoid ambiguity, 
// using loadJournalEntry wrapper if needed by HTML onclicks, but the HTML calls loadJournalEntry()
// Since I renamed it in ui.js to loadJournalEntryUI, and HTML calls loadJournalEntry(),
// I should define loadJournalEntry here as a wrapper or alias.

function loadJournalEntry() {
    // Acts as a bridge to UI function
    if(typeof window.loadJournalEntryUI === 'function') window.loadJournalEntryUI();
}

function saveJournalEntry() {
    const dateInput = document.getElementById('journal-date-input');
    const textInput = document.getElementById('journal-text');
    if(!dateInput || !textInput) return;

    const date = dateInput.value;
    const text = textInput.value;
    appData.journal[date] = text;
    saveData();
    renderJournalHistory();
    showToast("Journal Saved");
}

// --- SHOP ACTIONS ---
function buyShield() {
    if (appData.user.points >= 500) {
        appData.user.points -= 500; 
        appData.user.shields += 1;
        addHistory("Bought Shield", -500); 
        saveData(); 
        renderAll(); 
        showToast("Shield Equipped! 🛡️");
    } else { 
        showToast("Need 500 Points!"); 
    }
}

// --- PROFILE ACTIONS ---
function saveProfile() { 
    appData.user.name = document.getElementById('edit-name').value || "User"; 
    appData.user.tagline = document.getElementById('edit-tagline').value || ""; 
    saveData(); 
    renderProfileInfo(); 
    showToast("Profile Updated"); 
}

// --- TIME TRAVEL ---
function handleDateChange() {
    const inputDate = document.getElementById('simulated-date-input').value;
    if (!inputDate) return;
    const prevDate = appData.currentDate;
    appData.currentDate = inputDate;
    if (new Date(inputDate) > new Date(prevDate)) { 
        checkMissedDays(prevDate, inputDate); 
    }
    saveData(); 
    renderAll(); 
    showToast("Time Travelled! ⏳");
}

function resetToToday() { 
    handleDateChangeTo(new Date().toISOString().split('T')[0]); 
}

function handleDateChangeTo(targetDate) { 
    document.getElementById('simulated-date-input').value = targetDate; 
    handleDateChange(); 
}

// --- BACKUP / RESTORE ---
function backupData() {
    const dataStr = JSON.stringify(appData);
    
    // Check for Android Native Interface
    if (window.Android && window.Android.backupData) {
        window.Android.backupData(dataStr);
        showToast("Backup saved to Downloads");
        return;
    }

    // Fallback for Browser / Non-Android
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a'); 
    linkElement.setAttribute('href', dataUri); 
    linkElement.setAttribute('download', 'istiqamat_backup.json'); 
    linkElement.click(); 
    showToast("Backup Downloaded");
}

function restoreData(input) {
    const file = input.files[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) { 
        try { 
            const loadedData = JSON.parse(e.target.result); 
            if (loadedData.user && loadedData.habits) { 
                appData = loadedData; 
                saveData(); 
                renderAll(); 
                showToast("Data Restored"); 
                closeSettingsModal(); 
            } else { 
                alert("Invalid File"); 
            } 
        } catch (err) { 
            console.error(err); 
            alert("Error reading file"); 
        } 
    };
    reader.readAsText(file);
}

function wipeData() { 
    if (confirm("Reset EVERYTHING?")) { 
        localStorage.removeItem('istiqamat_data_v3'); 
        location.reload(); 
    } 
}
