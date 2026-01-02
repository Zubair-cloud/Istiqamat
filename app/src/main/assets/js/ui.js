// --- UI RENDERING & DOM MANIPULATION ---

function renderAll() {
    renderProfileInfo();
    renderHabits();
    renderManageList();
    renderShop();
    renderJournalHistory();
    updateLiquid();
    updatePointsDisplay();
    updateMainStreak();
    
    // Safety check for elements existing before trying to update them
    if(document.getElementById('current-date-display')) 
        document.getElementById('current-date-display').innerText = new Date(appData.currentDate).toDateString();
    
    if(document.getElementById('simulated-date-input'))
        document.getElementById('simulated-date-input').value = appData.currentDate;
    
    // Load current journal
    if(typeof loadJournalEntry === 'function') loadJournalEntry(); // In app.js or UI? Decided to keep loadJournalEntry in ui.js? 
    // Wait, loadJournalEntry reads DOM and sets DOM, so it fits here. I will include it below.
    else loadJournalEntryUI();

    // Update heatmap
    renderHeatmap();
}

function loadJournalEntryUI() {
    if(!document.getElementById('journal-date-input')) return;
    const date = document.getElementById('journal-date-input').value;
    const text = appData.journal[date] || "";
    document.getElementById('journal-text').value = text;
}

// --- STANDARD RENDERERS ---
function renderProfileInfo() {
    document.querySelectorAll('.display-name').forEach(el => el.innerText = appData.user.name);
    if(document.getElementById('edit-name')) document.getElementById('edit-name').value = appData.user.name;
    if(document.getElementById('edit-tagline')) document.getElementById('edit-tagline').value = appData.user.tagline;
    const firstLetter = appData.user.name ? appData.user.name.charAt(0).toUpperCase() : '?';
    if(document.getElementById('profile-avatar')) document.getElementById('profile-avatar').innerText = firstLetter;
}

function updatePointsDisplay() {
    if(document.getElementById('points-display')) document.getElementById('points-display').innerText = appData.user.points;
    document.querySelectorAll('.profile-points-display').forEach(el => el.innerText = appData.user.points + " 💎");
    if(document.getElementById('shop-total-points')) document.getElementById('shop-total-points').innerText = appData.user.points;
    if(document.getElementById('shop-total-shields')) document.getElementById('shop-total-shields').innerText = appData.user.shields;
}

function updateMainStreak() {
    let maxStreak = 0;
    appData.habits.forEach(h => { if (h.streak > maxStreak) maxStreak = h.streak; });
    if(document.getElementById('main-streak-count')) document.getElementById('main-streak-count').innerText = maxStreak;
}

function renderShop() {
    const list = document.getElementById('history-list');
    if(!list) return;
    list.innerHTML = '';
    if (appData.history.length === 0) { list.innerHTML = `<p style="text-align:center; color:#666; font-size:0.8rem;">No transactions yet.</p>`; return; }
    appData.history.forEach(t => {
        const isPos = t.amount >= 0;
        const html = `<div class="history-item"><div class="hist-left"><i class="ph-bold ${isPos ? 'ph-arrow-up-right' : 'ph-arrow-down-left'}" style="color:${isPos ? 'var(--neon-green)' : 'var(--danger)'}"></i><div><p style="font-size:0.9rem;">${t.desc}</p><p style="font-size:0.7rem; color:#aaa;">${t.date}</p></div></div><span class="hist-pts ${isPos ? 'hist-plus' : 'hist-minus'}">${isPos ? '+' : ''}${t.amount}</span></div>`;
        list.insertAdjacentHTML('beforeend', html);
    });
}

function updateLiquid() {
    const fluid = document.getElementById('main-fluid');
    if(!fluid) return;
    let totalWeight = appData.habits.length || 1; let currentWeight = 0;
    appData.habits.forEach(h => {
        const logKey = `${appData.currentDate}-${h.id}`; const dayLog = appData.habitLogs[logKey] || { completed: false, val: 0 };
        if (h.type === 'simple') currentWeight += dayLog.completed ? 1 : 0; else currentWeight += (dayLog.val / h.target);
    });
    let pct = (currentWeight / totalWeight) * 100; if (pct < 5) pct = 5; if (pct > 100) pct = 100;
    fluid.style.height = pct + '%'; updateHeatmapGlow(pct);
}

function updateHeatmapGlow(intensityPct) {
    const boxes = document.querySelectorAll('.heat-box');
    if (boxes.length > 0) {
        boxes.forEach(b => {
            if (!b.classList.contains('filled')) {
                b.style.background = 'rgba(255,255,255,0.05)';
                b.style.boxShadow = 'none';
            }
        });
    }
}

function renderHabits() {
    const list = document.getElementById('habit-list');
    if(!list) return;
    list.innerHTML = '';
    if (appData.habits.length === 0) list.innerHTML = `<p style="text-align:center; color:#666; margin-top:30px;">No habits yet. Click + to add.</p>`;

    appData.habits.forEach(h => {
        const logKey = `${appData.currentDate}-${h.id}`;
        const dayLog = appData.habitLogs[logKey] || { completed: false, val: 0 };
        const isComplete = dayLog.completed ? 'completed' : '';
        let rightSide = '';

        if (h.type === 'simple') rightSide = `<div class="checkbox-wrapper"><i class="ph-bold ph-check" style="${dayLog.completed ? '' : 'display:none'}"></i></div>`;
        else rightSide = `<div class="checkbox-wrapper" style="width:auto; padding:0 10px;">${dayLog.completed ? '<i class="ph-bold ph-check"></i>' : `${dayLog.val}/${h.target}`}</div>`;

        const timeDisplay = h.time ? `<span class="habit-time-badge">${h.time}</span>` : '';

        const html = `
  <div class="glass-panel habit-card ${isComplete}" onclick="handleHabitClick(${h.id})">
    <div class="habit-info">
      <i class="ph-fill ${h.icon} habit-icon"></i>
      <div class="habit-text">
        <h3>${h.title}</h3>
        <p>${timeDisplay} ${h.type === 'simple' ? (h.streak || 0) + ' Streak' : 'Daily Goal'}</p>
      </div>
    </div>
    ${rightSide}
  </div>
`;
        list.insertAdjacentHTML('beforeend', html);
    });
}

function renderManageList() {
    const list = document.getElementById('manage-list');
    if(!list) return;
    list.innerHTML = '';
    if (appData.habits.length === 0) { list.innerHTML = `<p style="text-align:center; color:#666; margin-top:20px;">Nothing to manage.</p>`; return; }
    appData.habits.forEach(h => {
        const timeText = h.time ? `• ${h.time}` : '';
        const html = `
      <div class="glass-panel habit-card" onclick="openEditModal(${h.id})" style="cursor:pointer;">
        <div class="habit-info">
            <i class="ph-fill ${h.icon} habit-icon"></i>
            <div class="habit-text">
                <h3>${h.title}</h3>
                <p style="color:#aaa;">${h.type} ${timeText}</p>
            </div>
        </div>
        <button onclick="event.stopPropagation(); deleteHabit(${h.id})" class="delete-btn"><i class="ph-bold ph-trash" style="font-size:1.2rem;"></i></button>
      </div>`;
        list.insertAdjacentHTML('beforeend', html);
    });
}

function renderJournalHistory() {
    const list = document.getElementById('journal-history');
    if(!list) return;
    list.innerHTML = '';

    const dates = Object.keys(appData.journal).sort().reverse();

    if (dates.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#666; padding:20px; font-size:0.8rem;">No entries yet.</p>`;
        return;
    }

    dates.slice(0, 5).forEach(date => {
        if (!appData.journal[date]) return;
        const html = `
        <div class="journal-entry">
            <div class="journal-date">${new Date(date).toDateString()}</div>
            <div class="journal-text">${appData.journal[date]}</div>
        </div>
    `;
        list.insertAdjacentHTML('beforeend', html);
    });
}

function renderHeatmap() {
    const grid = document.getElementById('heatmap');
    if(!grid) return;
    grid.innerHTML = '';

    const current = new Date(appData.currentDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthName = current.toLocaleString('default', { month: 'long' });

    if(document.getElementById('heatmap-title'))
        document.getElementById('heatmap-title').innerText = `Activity - ${monthName} ${year}`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        let intensity = 0;
        let totalHabits = appData.habits.length || 1;
        let completedCount = 0;

        appData.habits.forEach(h => {
            const log = appData.habitLogs[`${dateStr}-${h.id}`];
            if (log && log.completed) completedCount++;
        });
        if (completedCount > 0) intensity = completedCount / totalHabits;

        const isToday = dateStr === appData.currentDate;
        let bgStyle = `rgba(255,255,255,0.05)`;
        if (intensity > 0) {
            bgStyle = `rgba(0, 255, 140, ${0.3 + (intensity * 0.7)})`;
        }

        const div = document.createElement('div');
        div.className = 'heat-box-wrapper';

        let labelText = i;
        if (i === 1) labelText = `${i} ${monthName.substring(0, 3)}`;

        div.innerHTML = `
        <div class="heat-box ${isToday ? 'today' : ''}" style="background:${bgStyle}; ${intensity > 0 ? 'box-shadow:0 0 5px var(--neon-green);' : ''}"></div>
        <span class="heat-label" style="${isToday ? 'color:var(--neon-cyan); font-weight:bold;' : ''}">${labelText}</span>
    `;
        grid.appendChild(div);
    }
}

// --- NAVIGATION & MODALS ---
function switchTab(screenId, btn) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if(document.getElementById(screenId + '-screen'))
        document.getElementById(screenId + '-screen').classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    renderAll();
}

function switchManageTab(tab) {
    document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
    // Assuming 0 is habits, 1 is journal. Better selector would be robust but this works
    const tabs = document.querySelectorAll('.manage-tab');
    if(tabs.length >= 2) {
        if(tab === 'habits') tabs[0].classList.add('active');
        else tabs[1].classList.add('active');
    }

    if(document.getElementById('manage-habits-section'))
        document.getElementById('manage-habits-section').style.display = tab === 'habits' ? 'block' : 'none';
    
    if(document.getElementById('manage-journal-section'))
        document.getElementById('manage-journal-section').style.display = tab === 'journal' ? 'block' : 'none';

    if (tab === 'journal') {
        if(document.getElementById('journal-date-input')) document.getElementById('journal-date-input').value = appData.currentDate;
        loadJournalEntryUI();
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if(!t) return;
    const tMsg = document.getElementById('toast-msg');
    if(tMsg) tMsg.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function openAddModal() { if(document.getElementById('add-modal')) document.getElementById('add-modal').classList.add('open'); }
function closeAddModal() { if(document.getElementById('add-modal')) document.getElementById('add-modal').classList.remove('open'); }

function openEditModal(id) {
    const h = appData.habits.find(x => x.id === id);
    if (!h) return;

    if(document.getElementById('edit-habit-id')) document.getElementById('edit-habit-id').value = h.id;
    if(document.getElementById('edit-habit-name')) document.getElementById('edit-habit-name').value = h.title;
    if(document.getElementById('edit-habit-time')) document.getElementById('edit-habit-time').value = h.time || '';

    const targetGroup = document.getElementById('edit-target-group');
    if(targetGroup) {
        if (h.type === 'counter') {
            targetGroup.style.display = 'block';
            if(document.getElementById('edit-habit-target')) document.getElementById('edit-habit-target').value = h.target;
        } else {
            targetGroup.style.display = 'none';
        }
    }

    if(document.getElementById('edit-modal')) document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() { if(document.getElementById('edit-modal')) document.getElementById('edit-modal').classList.remove('open'); }

function openSettingsModal() { if(document.getElementById('settings-modal')) document.getElementById('settings-modal').classList.add('open'); }
function closeSettingsModal() { if(document.getElementById('settings-modal')) document.getElementById('settings-modal').classList.remove('open'); }

function toggleTargetInput() {
    const typeEl = document.getElementById('new-habit-type');
    const group = document.getElementById('target-group');
    if(typeEl && group) {
        group.style.display = typeEl.value === 'counter' ? 'block' : 'none';
    }
}
