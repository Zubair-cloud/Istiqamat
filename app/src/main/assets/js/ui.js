// --- UI RENDERING & DOM MANIPULATION ---
const GEM_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" style="vertical-align:middle;"><path d="M246,98.73l-56-64A8,8,0,0,0,184,32H72a8,8,0,0,0-6,2.73l-56,64a8,8,0,0,0,.17,10.73l112,120a8,8,0,0,0,11.7,0l112-120A8,8,0,0,0,246,98.73ZM222.37,96H180L144,48h36.37ZM74.58,112l30.13,75.33L34.41,112Zm89.6,0L128,202.46,91.82,112ZM96,96l32-42.67L160,96Zm85.42,16h40.17l-70.3,75.33ZM75.63,48H112L76,96H33.63Z"></path></svg>';

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function vibrateDevice(duration = 50) {
    if (window.Android && window.Android.vibrate) {
        window.Android.vibrate(duration); // Try bridge first
    } else if (navigator.vibrate) {
        navigator.vibrate(duration); // Standard web API
    }
}

function renderAll() {
    try { renderProfileInfo(); } catch (e) { console.error("Error in renderProfileInfo:", e); }
    try { renderHabits(); } catch (e) { console.error("Error in renderHabits:", e); }
    try { renderManageList(); } catch (e) { console.error("Error in renderManageList:", e); }
    try { renderRealShop(); } catch (e) { console.error("Error in renderRealShop:", e); }
    try { renderTransactionHistory(); } catch (e) { console.error("Error in renderTransactionHistory:", e); }
    try { renderJournalHistory(); } catch (e) { console.error("Error in renderJournalHistory:", e); }
    try { updateLiquid(); } catch (e) { console.error("Error in updateLiquid:", e); }
    try { updatePointsDisplay(); } catch (e) { console.error("Error in updatePointsDisplay:", e); }
    try { updateMainStreak(); } catch (e) { console.error("Error in updateMainStreak:", e); }
    
    // Safety check for elements existing before trying to update them
    try {
        if(document.getElementById('current-date-display')) 
            document.getElementById('current-date-display').innerText = new Date(appData.currentDate).toDateString();
        
        if(document.getElementById('simulated-date-input'))
            document.getElementById('simulated-date-input').value = appData.currentDate;
    } catch (e) { console.error("Error in date displays:", e); }
    
    // Load current journal
    try {
        if(typeof loadJournalEntry === 'function') loadJournalEntry(); 
        else loadJournalEntryUI();
    } catch(e) { console.error("Error loading journal:", e); }

    // Update heatmap
    try { renderHeatmap(); } catch (e) { console.error("Error in renderHeatmap:", e); }
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
    document.querySelectorAll('.profile-points-display').forEach(el => el.innerHTML = appData.user.points + ' ' + GEM_ICON);
    if(document.getElementById('shop-total-points')) document.getElementById('shop-total-points').innerText = appData.user.points;
    if(document.getElementById('shop-total-shields')) document.getElementById('shop-total-shields').innerText = appData.user.shields;
}

function updateMainStreak() {
    let maxStreak = 0;
    appData.habits.forEach(h => { if (h.streak > maxStreak) maxStreak = h.streak; });
    if(document.getElementById('main-streak-count')) document.getElementById('main-streak-count').innerText = maxStreak;
}

function switchTheme(themeName) {
    const themeLink = document.getElementById('theme-link');
    if (themeLink) themeLink.href = `css/themes/${themeName}.css`;
    
    // Persist if needed (appData is saved in buy/equip functions)
}




function renderRealShop() {
    const container = document.getElementById('shop-items-container');
    if(!container) return;
    container.innerHTML = '';

    // MODES DATA
    const modes = [
        { id: 'normal', name: 'Normal', price: 0, icon: 'sentiment_satisfied', desc: 'Standard encouraging vibes' },
        { id: 'sarcastic', name: 'Sarcasm', price: 500, icon: 'sentiment_neutral', desc: 'Brutal honesty. Not for the weak.' },
        { id: 'premium', name: 'Premium', price: 1000, icon: 'crown', desc: 'Elite motivation for achievers.' }
    ];

    let html = `<h2 class="section-title">Personalities</h2><div class="shop-list">`;
    
    modes.forEach((m, idx) => {
        const isUnlocked = appData.user.unlocked_modes && appData.user.unlocked_modes.includes(m.id);
        const isEquipped = appData.user.mode === m.id;
        
        let btnHtml = '';
        if (isUnlocked && isEquipped) {
            btnHtml = `<button class="btn-sm" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); padding:8px 16px; border-radius:12px;">Active</button>`;
        } else if (isUnlocked) {
            btnHtml = `<button onclick="equipItem('mode', '${m.id}')" class="btn-sm" style="background:var(--neon-cyan); color:#000; font-weight:bold; padding:8px 16px; border-radius:12px; border:none; box-shadow:0 0 10px rgba(0,245,255,0.4);">Equip</button>`;
        } else {
            btnHtml = `<button onclick="buyItem('mode', '${m.id}', ${m.price})" class="btn-sm" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); color:#fff; padding:8px 16px; border-radius:12px;">
                Buy ${m.price} ${GEM_ICON}
            </button>`;
        }

        html += `
        <div class="shop-card-wide" style="animation-delay:${idx * 0.05}s;">
            <div class="icon-box">
                <span class="material-symbols-rounded" style="font-size:1.5rem; color:var(--neon-cyan);">${m.icon}</span>
            </div>
            <div class="content-box">
                <h4 style="font-size:0.95rem; margin-bottom:2px;">${m.name}</h4>
                <p style="font-size:0.7rem;">${m.desc}</p>
            </div>
            <div class="action-box">
                ${btnHtml}
            </div>
        </div>`;
    });
    html += `</div>`;

    // POWER-UPS (GRID LAYOUT)
    html += `<h2 class="section-title">Power-Ups</h2><div class="shop-grid">`;
    
    // Watch Ad (Updated Button to Cyan to avoid Green Bottom Clash)
    const adLimitReached = appData.adWatchCount >= 2 && appData.adWatchDate === getLocalDateStr();
    html += `
        <div class="glass-panel shop-item" style="padding:15px; border-radius:24px;">
            <div style="margin-bottom:10px;">
                <span class="material-symbols-rounded" style="font-size:2.5rem; color:var(--neon-cyan);">play_circle</span>
            </div>
            <h4 style="color:#fff; font-size:1rem; margin-bottom:4px;">Watch Ad</h4>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:12px;">Earn +20 Points (${appData.adWatchCount || 0}/2 today)</p>
            <button onclick="watchAdForPoints()" ${adLimitReached ? 'disabled' : ''} style="width:100%; padding:10px; border-radius:12px; background:${adLimitReached ? '#333' : 'var(--neon-cyan)'}; color:${adLimitReached ? '#777' : '#000'}; font-weight:bold; border:none; box-shadow:${adLimitReached ? 'none' : '0 0 10px rgba(0,245,255,0.4)'}; cursor:${adLimitReached ? 'not-allowed' : 'pointer'};">
                ${adLimitReached ? 'Limit Reached' : 'Watch +20'} ${GEM_ICON}
            </button>
        </div>
    `;

    // Shield
    html += `
        <div class="glass-panel shop-item" style="padding:15px; border-radius:24px;">
            <div style="margin-bottom:10px;">
                <span class="material-symbols-rounded" style="font-size:2.5rem; color:var(--neon-green);">security</span>
            </div>
            <h4 style="color:#fff; font-size:1rem; margin-bottom:4px;">Streak Shield</h4>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:12px;">Owned: ${appData.user.shields || 0}</p>
            <button onclick="buyItem('powerup', 'shield', 500)" style="width:100%; padding:10px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); color:#fff; font-weight:bold;">
                Buy 500 ${GEM_ICON}
            </button>
        </div>
    `;
    html += `</div>`;

    // THEMES (FULL WIDTH / LIST LAYOUT)
    html += `<h2 class="section-title">Themes</h2><div class="shop-list">`;
    
    const themes = [
        { id: 'default', name: 'Classic Blue', desc: 'The original Steadfast vibe.', price: 0, icon: 'palette' },
        { id: 'neon-gold', name: 'Neon Gold', desc: 'Royal Black & Liquid Gold.', price: 300, icon: 'trophy' },
        { id: 'ruby-red', name: 'Ruby Red', desc: 'Deep Red & Intense Passion.', price: 300, icon: 'favorite' }
    ];

    themes.forEach((t, idx) => {
        const isUnlocked = appData.user.unlocked_themes && appData.user.unlocked_themes.includes(t.id);
        const isActive = appData.user.theme === t.id; // We need to store active theme in appData.user.theme if not already

        let actionBtn = '';
        if (isActive) {
            actionBtn = `<div style="padding:6px 12px; background:rgba(255,255,255,0.1); border-radius:8px; font-size:0.75rem; color:#fff;">Active</div>`;
        } else if (isUnlocked || t.price === 0) {
            actionBtn = `<button onclick="equipItem('theme', '${t.id}')" style="padding:6px 12px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3); border-radius:8px; font-size:0.75rem; color:#fff; cursor:pointer;">Equip</button>`;
        } else {
            actionBtn = `<button onclick="buyItem('theme', '${t.id}', ${t.price})" style="padding:6px 12px; background:var(--neon-green); border-radius:8px; font-size:0.75rem; color:#000; font-weight:bold; cursor:pointer; border:none;">Buy ${t.price} ${GEM_ICON}</button>`;
        }

        html += `
        <div class="shop-card-wide" style="animation-delay:${idx * 0.05}s; display:flex; justify-content:space-between; align-items:center; padding:15px; border-radius:16px; margin-bottom:10px; background:var(--glass-bg); border:1px solid var(--glass-border);">
            <div style="display:flex; align-items:center;">
                <div class="icon-box" style="margin-right:15px;">
                    <span class="material-symbols-rounded" style="font-size:1.8rem; color:${t.id === 'ruby-red' ? '#ff0033' : (t.id === 'neon-gold' ? '#ffd700' : 'var(--neon-cyan)')};">${t.icon}</span>
                </div>
                <div>
                    <h4 style="color:#fff; font-size:0.95rem; margin-bottom:2px;">${t.name}</h4>
                    <p style="color:#aaa; font-size:0.75rem;">${t.desc}</p>
                </div>
            </div>
            <div>${actionBtn}</div>
        </div>
        `;
    });
    html += `</div>`;

    container.innerHTML = html;
    
    // Trigger History Render
    renderTransactionHistory();
}

function renderTransactionHistory() {
    const list = document.getElementById('history-list');
    if(!list) return;
    list.innerHTML = '';
    
    const hist = appData.history || [];
    if(hist.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#666; font-size:0.8rem;">No transactions yet.</p>';
        return;
    }
    
    // Show last 5
    hist.slice(0, 5).forEach(item => {
        const isPlus = item.amount > 0;
        const color = isPlus ? 'var(--neon-green)' : 'var(--danger)';
        const sign = isPlus ? '+' : '';
        
        const html = `
        <div class="history-item" style="border-bottom:1px solid rgba(255,255,255,0.05); padding:10px 0;">
            <div style="font-size:0.9rem; color:#fff;">${escapeHTML(item.desc)}</div>
            <div style="font-weight:bold; color:${color}; font-size:0.9rem;">${sign}${item.amount} ${GEM_ICON}</div>
        </div>`;
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

    appData.habits.forEach((h, idx) => {
        const logKey = `${appData.currentDate}-${h.id}`;
        const dayLog = appData.habitLogs[logKey] || { completed: false, val: 0 };
        const isComplete = dayLog.completed ? 'completed' : '';
        let rightSide = '';

        if (h.type === 'simple') rightSide = `<div class="checkbox-wrapper"><i class="ph-bold ph-check" style="${dayLog.completed ? '' : 'display:none'}"></i></div>`;
        else rightSide = `<div class="checkbox-wrapper" style="width:auto; padding:0 10px;">${dayLog.completed ? '<i class="ph-bold ph-check"></i>' : `${dayLog.val}/${h.target}`}</div>`;

        const timeDisplay = h.time ? `<span class="habit-time-badge">${h.time}</span>` : '';

        const html = `
  <div class="glass-panel habit-card ${isComplete}" style="animation-delay:${idx * 0.05}s;" onclick="handleHabitClick(${h.id})">
    <div class="habit-info">
      <i class="ph-fill ${h.icon} habit-icon"></i>
      <div class="habit-text">
        <h3>${escapeHTML(h.title)}</h3>
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
    appData.habits.forEach((h, idx) => {
        const timeText = h.time ? `• ${h.time}` : '';
        const html = `
      <div class="glass-panel habit-card" onclick="openEditModal(${h.id})" style="animation-delay:${idx * 0.05}s; cursor:pointer;">
        <div class="habit-info">
            <i class="ph-fill ${h.icon} habit-icon"></i>
            <div class="habit-text">
                <h3>${escapeHTML(h.title)}</h3>
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
        const d = new Date(date);
        const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        
        const html = `
        <div class="glass-panel" style="padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="color:var(--neon-cyan); font-weight:bold; font-size:0.9rem;">${dateStr}</div>
                <i class="ph-bold ph-caret-right" style="color:#666;"></i>
            </div>
            <div style="font-size:0.9rem; color:#ddd; line-height:1.4; max-height:60px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                ${escapeHTML(appData.journal[date])}
            </div>
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
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if(document.getElementById(screenId + '-screen'))
        document.getElementById(screenId + '-screen').classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    renderAll();
}

function switchManageTab(tab) {
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
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

function showToast(keyOrMsg, params = {}) {
    const t = document.getElementById('toast');
    if(!t) return;
    const tMsg = document.getElementById('toast-msg');
    
    // Support raw messages (legacy) or keys
    let msg = "";
    if (typeof getMsg === 'function' && keyOrMsg.indexOf(' ') === -1 && keyOrMsg.indexOf('_') > -1) {
        msg = getMsg(keyOrMsg, params);
    } else {
        msg = keyOrMsg;
    }

    if(tMsg) tMsg.innerText = msg;

    // Reset Animation
    t.classList.remove('animating');
    void t.offsetWidth; // Force Reflow
    t.classList.add('animating');
}

function openAddModal() { 
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
    if(document.getElementById('add-modal')) document.getElementById('add-modal').classList.add('open'); 
}
function closeAddModal() { if(document.getElementById('add-modal')) document.getElementById('add-modal').classList.remove('open'); }

function openEditModal(id) {
    if (typeof vibrateDevice === 'function') vibrateDevice(30);
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

function openLicensesModal() { if(document.getElementById('licenses-modal')) document.getElementById('licenses-modal').classList.add('open'); }
function closeLicensesModal() { if(document.getElementById('licenses-modal')) document.getElementById('licenses-modal').classList.remove('open'); }

function toggleTargetInput() {
    const typeEl = document.getElementById('new-habit-type');
    const group = document.getElementById('target-group');
    if(typeEl && group) {
        group.style.display = typeEl.value === 'counter' ? 'block' : 'none';
    }
}
