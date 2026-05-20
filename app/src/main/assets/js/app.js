// --- GLASS DIALOG SYSTEM ---
let _glassDialogResolve = null;

function resolveGlassDialog(val) {
    document.getElementById('glass-dialog-overlay').classList.remove('open');
    if (_glassDialogResolve) _glassDialogResolve(val);
    _glassDialogResolve = null;
}

function glassConfirm(msg, iconClass) {
    return new Promise(function(resolve) {
        _glassDialogResolve = resolve;
        document.getElementById('glass-dialog-icon').innerHTML = '<i class="' + (iconClass || 'ph-fill ph-warning') + '" style="font-size:2.5rem; color:var(--neon-cyan);"></i>';
        document.getElementById('glass-dialog-title').textContent = 'Are you sure?';
        document.getElementById('glass-dialog-msg').textContent = msg;
        document.getElementById('glass-dialog-cancel').style.display = '';
        document.getElementById('glass-dialog-ok').textContent = 'Confirm';
        document.getElementById('glass-dialog-overlay').classList.add('open');
    });
}

function glassAlert(msg, iconClass) {
    return new Promise(function(resolve) {
        _glassDialogResolve = resolve;
        document.getElementById('glass-dialog-icon').innerHTML = '<i class="' + (iconClass || 'ph-fill ph-info') + '" style="font-size:2.5rem; color:var(--neon-cyan);"></i>';
        document.getElementById('glass-dialog-title').textContent = '';
        document.getElementById('glass-dialog-msg').textContent = msg;
        document.getElementById('glass-dialog-cancel').style.display = 'none';
        document.getElementById('glass-dialog-ok').textContent = 'OK';
        document.getElementById('glass-dialog-overlay').classList.add('open');
    });
}

// --- APP INITIALIZATION & CONTROLLER LOGIC ---

window.onload = () => {
    loadData();
    if (new Date(appData.currentDate) > new Date(appData.lastLoginDate)) {
        checkMissedDays(appData.lastLoginDate, appData.currentDate);
    }
    
    // Init Journal Date
    const journalInput = document.getElementById('journal-date-input');
    if (journalInput) journalInput.value = appData.currentDate;
    
    // Reset/Init Ad Limit
    if (!appData.adWatchCount || appData.adWatchDate !== appData.currentDate) {
        appData.adWatchCount = 0;
        appData.adWatchDate = appData.currentDate;
        saveData();
    }
    
    // Init Theme
    if (appData.user.theme && appData.user.theme !== 'default') {
        switchTheme(appData.user.theme);
    }
    
    renderAll();
};

// --- ADMOB REWARD CALLBACK ---
window.updateFromCloud = function(jsonStr) {
    try {
        const cloudData = JSON.parse(jsonStr);
        appData.user.points = typeof cloudData.points !== 'undefined' ? cloudData.points : appData.user.points;
        appData.user.streak = typeof cloudData.streak !== 'undefined' ? cloudData.streak : appData.user.streak;
        appData.user.special_coins = typeof cloudData.special_coins !== 'undefined' ? cloudData.special_coins : 0;
        appData.user.shields = typeof cloudData.shields !== 'undefined' ? cloudData.shields : appData.user.shields;
        appData.user.email = cloudData.email || "User";
        appData.user.name = cloudData.name || appData.user.name || "User";
        if(cloudData.premium_until) appData.user.premium_until = cloudData.premium_until;
        
        saveData();
        renderAll();
    } catch(e) {
        console.error("Cloud merge failed", e);
    }
}

window.onSecureAdRewardSuccess = function(amount) {
    const today = getLocalDateStr();
    if (appData.adWatchDate !== today) {
         appData.adWatchCount = 0;
         appData.adWatchDate = today;
    }
    appData.adWatchCount++;
    appData.user.points += amount;
    addHistory("Ad Reward (Cloud Verified)", amount);
    saveData();
    renderAll();
    if(typeof showToast === 'function') showToast('points_gained', { pts: amount });
}

function watchAdForPoints() {
    if (!appData.user.email || appData.user.email === "User") {
        glassConfirm("You must connect your Google Account to earn rewards. Go to Settings?", "ph-fill ph-google-logo").then(function(yes) {
            if(yes) {
                openSettingsModal();
            }
        });
        return;
    }

    const today = getLocalDateStr();
    if (appData.adWatchDate !== today) {
         appData.adWatchCount = 0;
         appData.adWatchDate = today;
    }

    if (appData.adWatchCount >= 2) {
        showToast("Daily Limit Reached! 🚫");
        return;
    }

    if (window.Android && window.Android.showRewardedAd) {
        window.Android.showRewardedAd();
    } else {
        glassAlert("Ads are only available on Android App.", "ph-fill ph-device-mobile");
    }
}


// --- HABIT ACTIONS ---
function handleHabitClick(id) {
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
    const habit = appData.habits.find(h => h.id === id);
    if (!habit) return; // Guard: habit may have been deleted
    const logKey = `${appData.currentDate}-${habit.id}`;
    if (!appData.habitLogs[logKey]) appData.habitLogs[logKey] = { completed: false, val: 0 };
    const dayLog = appData.habitLogs[logKey];

    if (habit.type === 'simple') {
        dayLog.completed = !dayLog.completed;
        if (dayLog.completed) {
            habit.streak = (habit.streak || 0) + 1;
            showToast('habit_done');
        } else {
            habit.streak = Math.max(0, (habit.streak || 0) - 1);
            showToast('habit_undone');
        }
    }
    else if (habit.type === 'counter') {
        if (dayLog.completed) { 
            // Undo complete
            dayLog.val = 0; 
            dayLog.completed = false; 
            showToast('habit_undone');
        } else {
            dayLog.val++;
            if (dayLog.val >= habit.target) {
                dayLog.val = habit.target; 
                dayLog.completed = true;
                showToast('goal_reached');
            }
        }
    }
    
    saveData(); 
    renderAll();
}

function addNewHabit() {
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
    const name = document.getElementById('new-habit-name').value;
    const type = document.getElementById('new-habit-type').value;
    const target = document.getElementById('new-habit-target').value;
    const time = document.getElementById('new-habit-time').value;

    if (!name) return glassAlert("Please enter a name", "ph-fill ph-pencil-simple");
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
    if (typeof scheduleAllNotifications === 'function') scheduleAllNotifications();
    closeAddModal(); 
    renderAll(); 
    showToast('new_habit');
}

function saveEditHabit() {
    const id = Number(document.getElementById('edit-habit-id').value);
    const name = document.getElementById('edit-habit-name').value;
    const time = document.getElementById('edit-habit-time').value;
    const target = document.getElementById('edit-habit-target').value;

    const h = appData.habits.find(x => x.id === id);
    if (h) {
        h.title = name;
        h.time = time;
        if (h.type === 'counter') h.target = parseInt(target);
        saveData();
        if (typeof scheduleAllNotifications === 'function') scheduleAllNotifications();
        renderAll();
        closeEditModal();
        showToast('habit_updated');
    }
}

function deleteHabit(id) {
    glassConfirm("Delete this habit permanently?", "ph-fill ph-trash").then(function(yes) {
        if (yes) {
            appData.habits = appData.habits.filter(function(h) { return h.id !== id; }); 
            saveData(); 
            if (typeof scheduleAllNotifications === 'function') scheduleAllNotifications();
            renderAll(); 
            showToast('habit_deleted'); 
        }
    });
}

// --- NOTIFICATIONS ---
function scheduleAllNotifications() {
    if (typeof window.Android === 'undefined' || typeof window.Android.scheduleHabit === 'undefined') return;

    // 1. Cancel all (Conceptually, or we overwrite)
    // To be clean, we should probably have a cancelAll or valid IDs list.
    // For now, let's just schedule active habits. Android side uses ID to overwrite.
    
    appData.habits.forEach(h => {
        if (!h.time) return; // No time set
        
        // Get generic habit message based on mode
        let msg = getMsg('habit_reminder', { habit: h.title });
        
        // If we don't have a specific 'habit_reminder' in messages.js yet, let's add one or fallback
        if (!msg || msg === 'Done') msg = `Time for ${h.title}! ⏰`;

        // Parse days (default to daily if not specified)
        // Previous logic assumed simple daily check for habits?
        // App data struct: { id, title, time, type... }
        // Let's assume daily for now unless we add 'days' to habit struct.
        // We'll pass [0,1,2,3,4,5,6] for all days.
        const days = JSON.stringify([0,1,2,3,4,5,6]); 
        
        window.Android.scheduleHabit(h.id, h.title, h.time, days, msg);
    });

    // Schedule Daily Check-in (e.g. 9 PM)
    if (window.Android.updateSettings) {
        // hardcoded 9pm daily check for now
        window.Android.updateSettings("21:00", "20:00", true, true);
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
    showToast('journal_saved');
}

// --- SHOP ACTIONS ---
function buyItem(type, id, cost) {
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
    if (appData.user.points >= cost) {
        appData.user.points -= cost;
        
        if (type === 'mode') {
            if (!appData.user.unlocked_modes) appData.user.unlocked_modes = ['normal'];
            appData.user.unlocked_modes.push(id);
            addHistory(`Bought ${id} Mode`, -cost);
        } else if (type === 'theme') {
            if (!appData.user.unlocked_themes) appData.user.unlocked_themes = ['default'];
            appData.user.unlocked_themes.push(id);
            addHistory(`Bought ${id} Theme`, -cost);
        } else if (type === 'powerup' && id === 'shield') {
            appData.user.shields = (appData.user.shields || 0) + 1;
            addHistory(`Bought Streak Shield`, -cost);
        }

        saveData();
        renderAll(); // Will re-render shop with new state
        showToast('item_bought', { item: id }); // Need to add this key to messages
    } else {
        showToast('shield_need_points'); // Reuse "Need Points" message or add generic
    }
}

function equipItem(type, id) {
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
    if (type === 'mode') {
        appData.user.mode = id;
        showToast('profile_updated'); // "Identity Calibrated" etc
    } else if (type === 'theme') {
        appData.user.theme = id;
        switchTheme(id);
        if (typeof showToast === 'function') showToast(`Theme Equitable: ${id}`);
    }
    saveData();
    renderAll();
}

function buyShield() {
    // Legacy mapping to new system or keep as shortcut
    buyItem('powerup', 'shield', 500); 
}

// --- PROFILE ACTIONS ---
function saveProfile() { 
    appData.user.name = document.getElementById('edit-name').value || "User"; 
    appData.user.tagline = document.getElementById('edit-tagline').value || ""; 
    saveData(); 
    renderProfileInfo(); 
    showToast('profile_updated'); 
}

// --- TIME TRAVEL ---


// --- CLOUD LOGIN ---
function loginWithGoogle() {
    if (window.Android && window.Android.triggerSignIn) {
        window.Android.triggerSignIn();
        showToast("Connecting...");
    } else {
        glassAlert("Cloud Sync is only available on the Android app.", "ph-fill ph-cloud-x");
    }
}

// --- BACKUP / RESTORE ---
function backupData() {
    const dataStr = JSON.stringify(appData);
    
    // Check for Android Native Interface
    if (window.Android && window.Android.backupData) {
        window.Android.backupData(dataStr);
        showToast('backup_saved');
        return;
    }

    // Fallback for Browser / Non-Android
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a'); 
    linkElement.setAttribute('href', dataUri); 
    linkElement.setAttribute('download', 'istiqamat_backup.json'); 
    linkElement.click(); 
    showToast('backup_saved');
}

function restoreData(input) {
    const file = input.files[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) { 
        try { 
            const loadedData = JSON.parse(e.target.result); 
            if (loadedData.user && loadedData.habits) { 
                
                const defaultData = {
                    user: { name: "User", tagline: "Stay Consistent", points: 0, shields: 0, mode: 'normal', unlocked_modes: ['normal'], unlocked_themes: ['default'] },
                    habits: [],
                    habitLogs: {},
                    journal: {},
                    history: [],
                    lastLoginDate: getLocalDateStr(),
                    currentDate: getLocalDateStr()
                };

                appData = {
                    ...defaultData,
                    ...loadedData,
                    user: {
                        ...defaultData.user,
                        ...loadedData.user
                    }
                };

                if (!Array.isArray(appData.habits)) appData.habits = [];
                if (!appData.habitLogs) appData.habitLogs = {};
                if (!appData.history) appData.history = [];
                if (!appData.user.unlocked_modes) appData.user.unlocked_modes = ['normal'];
                if (!appData.user.unlocked_themes) appData.user.unlocked_themes = ['default'];

                // XSS Sanitization — clean all user-facing string fields
                if (typeof escapeHTML === 'function') {
                    appData.user.name = escapeHTML(appData.user.name || 'User');
                    appData.user.tagline = escapeHTML(appData.user.tagline || '');
                    appData.habits.forEach(function(h) {
                        h.title = escapeHTML(h.title || '');
                    });
                    Object.keys(appData.journal || {}).forEach(function(key) {
                        if (typeof appData.journal[key] === 'string') {
                            appData.journal[key] = escapeHTML(appData.journal[key]);
                        }
                    });
                }
                
                saveData(); 
                renderAll(); 
                showToast('restore_done'); 
                closeSettingsModal(); 
            } else { 
                glassAlert("Invalid File", "ph-fill ph-x-circle"); 
            } 
        } catch (err) { 
            console.error(err); 
            glassAlert("Error reading file", "ph-fill ph-x-circle"); 
        } 
    };
    reader.readAsText(file);
}

function wipeData() { 
    glassConfirm("Reset EVERYTHING? All habits, points, and data will be lost forever!", "ph-fill ph-skull").then(function(yes) {
        if (yes) { 
            localStorage.removeItem('istiqamat_data_v3'); 
            location.reload(); 
        }
    }); 
}