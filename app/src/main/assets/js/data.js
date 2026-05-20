// --- HELPER FUNC ---
function getLocalDateStr() {
    var tzOffset = (new Date()).getTimezoneOffset() * 60000;
    var localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime.split('T')[0];
}

// Simple hash for integrity check (djb2)
function simpleHash(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

// Sanitize numeric fields to prevent NaN corruption
function sanitizeNumeric(val, fallback) {
    var num = Number(val);
    return isNaN(num) ? fallback : num;
}

// --- APP STATE ---
var appData = {
    user: { name: "User", tagline: "Stay Consistent", points: 0, shields: 0, mode: 'normal', theme: 'default', unlocked_modes: ['normal'], unlocked_themes: ['default'] },
    habits: [
        { id: 1001, title: "Morning Meditation", icon: "ph-brain", type: "simple", streak: 0, time: "06:00" },
        { id: 1002, title: "Hydrate", icon: "ph-drop", type: "counter", streak: 0, target: 8, time: "" }
    ],
    habitLogs: {},
    journal: {}, 
    history: [],
    lastLoginDate: getLocalDateStr(),
    currentDate: getLocalDateStr()
};

// --- DATA FUNCTIONS ---
function loadData() {
    try {
        var saved = localStorage.getItem('istiqamat_data_v3');
        if (saved) {
            // Verify checksum integrity
            var savedHash = localStorage.getItem('istiqamat_hash_v3');
            if (savedHash && simpleHash(saved) !== savedHash) {
                console.warn('Data integrity check failed — possible tampering detected');
                if (typeof showToast === 'function') showToast('⚠️ Data integrity warning');
            }

            appData = JSON.parse(saved);
            if (!appData.habitLogs) appData.habitLogs = {};
            if (!appData.journal) appData.journal = {};
            if (!appData.history) appData.history = [];
            if (!appData.user) appData.user = { name: "User", tagline: "Stay Consistent", points: 0, shields: 0, mode: 'normal', theme: 'default', unlocked_modes: ['normal'], unlocked_themes: ['default'] };
            if (!appData.user.theme) appData.user.theme = 'default';
            if (!Array.isArray(appData.habits)) appData.habits = [];

            // NaN sanitization on critical numeric fields
            appData.user.points = sanitizeNumeric(appData.user.points, 0);
            appData.user.shields = sanitizeNumeric(appData.user.shields, 0);
            appData.habits.forEach(function(h) {
                h.streak = sanitizeNumeric(h.streak, 0);
                if (h.type === 'counter') h.target = sanitizeNumeric(h.target, 1);
            });

            // Critical Bug Fix: Always override loaded currentDate with the actual REAL date today
            appData.currentDate = getLocalDateStr();
        }
    } catch (e) {
        console.error('Data load failed — starting fresh:', e);
        if (typeof showToast === 'function') showToast('Data corrupted, starting fresh 🔄');
        appData = {
            user: { name: "User", tagline: "Stay Consistent", points: 0, shields: 0, mode: 'normal', theme: 'default', unlocked_modes: ['normal'], unlocked_themes: ['default'] },
            habits: [],
            habitLogs: {},
            journal: {},
            history: [],
            lastLoginDate: getLocalDateStr(),
            currentDate: getLocalDateStr()
        };
        localStorage.removeItem('istiqamat_data_v3');
        localStorage.removeItem('istiqamat_hash_v3');
    }
}

function saveData() {
    appData.lastLoginDate = appData.currentDate;
    var dataStr = JSON.stringify(appData);
    localStorage.setItem('istiqamat_data_v3', dataStr);
    localStorage.setItem('istiqamat_hash_v3', simpleHash(dataStr));
    
    // Sync Widget Data to Android
    if (typeof window.Android !== 'undefined' && typeof window.Android.syncData === 'function') {
        window.Android.syncData(dataStr);
    }
}

function addHistory(desc, amount) {
    appData.history.unshift({ desc, amount, date: appData.currentDate });
    if (appData.history.length > 20) appData.history.pop();
}

function checkMissedDays(lastDateStr, newDateStr) {
    const last = new Date(lastDateStr);
    const curr = new Date(newDateStr);
    const oneDay = 24 * 60 * 60 * 1000;
    let loopDate = new Date(last.getTime());

    while (loopDate < curr) {
        const d = loopDate;
        const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        processDayEnd(dateStr);
        loopDate = new Date(loopDate.getTime() + oneDay);
    }
}

function processDayEnd(dateStr) {
    let shieldUsedForDay = false;
    let habitsMissed = false;
    let habitsDone = 0;
    const totalHabits = appData.habits.length;

    for (const h of appData.habits) {
        const logKey = `${dateStr}-${h.id}`;
        const log = appData.habitLogs[logKey];
        if (!(log && log.completed)) {
            habitsMissed = true;
        } else {
            habitsDone++;
        }
    }

    if (totalHabits > 0 && habitsDone > 0) {
        let earnedPoints = Math.ceil((habitsDone / totalHabits) * 10);
        appData.user.points += earnedPoints;
        addHistory(`Daily Points (${dateStr})`, earnedPoints);

        if (window.Android && window.Android.uploadDailySync) {
            window.Android.uploadDailySync(earnedPoints, appData.user.points, habitsDone, appData.user.streak || 0);
        }
    }

    if (habitsMissed) {
        if (appData.user.shields > 0) {
            appData.user.shields--;
            shieldUsedForDay = true;
            addHistory(`Shield Used (${dateStr})`, 0);
            if (typeof showToast === 'function') showToast(`Shield Used for ${dateStr}! 🛡️`);
        }
    }

    appData.habits.forEach(h => {
        const logKey = `${dateStr}-${h.id}`;
        const log = appData.habitLogs[logKey];
        if (!(log && log.completed)) {
            if (!shieldUsedForDay && h.streak > 0) {
                h.streak = 0;
                if (typeof showToast === 'function') showToast(`${h.title} Streak Reset 😢`);
            }
        }
    });
    saveData();
}
