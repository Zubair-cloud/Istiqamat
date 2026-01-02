// --- APP STATE ---
let appData = {
    user: { name: "Jubbu", tagline: "Consistent Believer", points: 0, shields: 0 },
    habits: [
        { id: 1, title: "Fajr Namaz", icon: "ph-mosque", type: "simple", streak: 0, time: "05:30" },
        { id: 2, title: "Drink Water", icon: "ph-drop", type: "counter", streak: 0, target: 8, time: "" }
    ],
    habitLogs: {},
    journal: {}, // Format: "YYYY-MM-DD": "Journal text"
    history: [],
    lastLoginDate: new Date().toISOString().split('T')[0],
    currentDate: new Date().toISOString().split('T')[0]
};

// --- DATA FUNCTIONS ---
function loadData() {
    const saved = localStorage.getItem('istiqamat_data_v3');
    if (saved) {
        appData = JSON.parse(saved);
        if (!appData.habitLogs) appData.habitLogs = {};
        if (!appData.journal) appData.journal = {};
        if (!appData.currentDate) appData.currentDate = new Date().toISOString().split('T')[0];
    }
}

function saveData() {
    appData.lastLoginDate = appData.currentDate;
    localStorage.setItem('istiqamat_data_v3', JSON.stringify(appData));
}

function addHistory(desc, amount) {
    appData.history.unshift({ desc, amount, date: appData.currentDate });
    if (appData.history.length > 20) appData.history.pop();
    saveData();
}

function checkMissedDays(lastDateStr, newDateStr) {
    const last = new Date(lastDateStr);
    const curr = new Date(newDateStr);
    const oneDay = 24 * 60 * 60 * 1000;
    let loopDate = new Date(last.getTime());

    while (loopDate < curr) {
        const dateStr = loopDate.toISOString().split('T')[0];
        processDayEnd(dateStr);
        loopDate = new Date(loopDate.getTime() + oneDay);
    }
}

function processDayEnd(dateStr) {
    let shieldUsedForDay = false;
    let habitsMissed = false;

    for (const h of appData.habits) {
        const logKey = `${dateStr}-${h.id}`;
        const log = appData.habitLogs[logKey];
        if (!(log && log.completed)) {
            habitsMissed = true;
            break;
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
