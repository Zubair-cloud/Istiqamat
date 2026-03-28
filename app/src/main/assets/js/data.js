// --- HELPER FUNC ---
function getLocalDateStr() {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime.split('T')[0];
}

// --- APP STATE ---
let appData = {
    user: { name: "User", tagline: "Stay Consistent", points: 0, shields: 0, mode: 'normal', unlocked_modes: ['normal'], unlocked_themes: ['default'] },
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
    const saved = localStorage.getItem('istiqamat_data_v3');
    if (saved) {
        appData = JSON.parse(saved);
        if (!appData.habitLogs) appData.habitLogs = {};
        if (!appData.journal) appData.journal = {};
        
        // Critical Bug Fix: Always override loaded currentDate with the actual REAL date today
        appData.currentDate = getLocalDateStr();
    }
}

function saveData() {
    appData.lastLoginDate = appData.currentDate;
    localStorage.setItem('istiqamat_data_v3', JSON.stringify(appData));
    
    // Sync Widget Data to Android
    if (typeof window.Android !== 'undefined' && typeof window.Android.syncData === 'function') {
        window.Android.syncData(JSON.stringify(appData));
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
