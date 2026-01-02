import { store } from '../stores/store.js';

export function Profile() {
  const container = document.createElement('div');
  container.className = 'screen active';
  container.id = 'profile-screen';

  const state = store.get();

  // Points Badge
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
      <h1>Profile</h1>
      <div style="display:flex; gap:10px; align-items:center;">
          <div class="points-badge profile-points-display" style="box-shadow:0 0 10px var(--neon-green);">${state.user.points} 💎</div>
          <button id="settings-trigger" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem;"><i class="ph-fill ph-gear"></i></button>
      </div>
  `;
  container.appendChild(header);

  const content = document.createElement('div');
  content.className = 'profile-container';
  content.style.padding = '0 20px';

  // USER CARD - Premium Glow
  const userCard = document.createElement('div');
  userCard.className = 'glass-panel profile-edit-card';
  userCard.style.textAlign = 'center';
  userCard.style.padding = '30px 20px';
  userCard.style.marginBottom = '20px';
  
  const firstLetter = state.user.name ? state.user.name.charAt(0).toUpperCase() : '?';
  
  userCard.innerHTML = `
      <div id="profile-avatar" class="avatar-lg" style="box-shadow: 0 0 25px var(--neon-cyan); border: 2px solid #fff;">${firstLetter}</div>
      <div style="margin-top: 20px;">
          <input id="edit-name" class="profile-input" style="font-weight:800; font-size:1.6rem; letter-spacing:1px; width:80%;" placeholder="Your Name" value="${state.user.name}">
          <input id="edit-tagline" class="profile-input" style="font-size:0.9rem; color:var(--neon-cyan); margin-top:5px; font-style:italic;" placeholder="Your tagline..." value="${state.user.tagline || ''}">
      </div>
  `;
  content.appendChild(userCard);

  // STATS ROW
  const statsRow = document.createElement('div');
  statsRow.style.display = 'grid';
  statsRow.style.gridTemplateColumns = '1fr 1fr';
  statsRow.style.gap = '15px';
  statsRow.style.marginBottom = '25px';

  // Calculate stats
  const totalHabits = state.history.length; 
  const currentStreak = Math.max(0, ...state.habits.map(h => h.streak || 0));

  statsRow.innerHTML = `
    <div class="glass-panel" style="padding:15px; text-align:center;">
        <i class="ph-fill ph-trophy" style="font-size:1.8rem; color:var(--neon-orange); margin-bottom:5px;"></i>
        <div style="font-size:1.2rem; font-weight:bold;">${currentStreak}</div>
        <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Best Streak</div>
    </div>
    <div class="glass-panel" style="padding:15px; text-align:center;">
        <i class="ph-fill ph-shield-check" style="font-size:1.8rem; color:var(--neon-green); margin-bottom:5px;"></i>
        <div style="font-size:1.2rem; font-weight:bold;">${state.user.shields || 0}</div>
        <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Shields</div>
    </div>
  `;
  content.appendChild(statsRow);

  // HEATMAP
  const current = new Date(state.currentDate);
  const monthName = current.toLocaleString('default', { month: 'long', year: 'numeric' });

  const heatTitle = document.createElement('span');
  heatTitle.className = 'section-title';
  heatTitle.innerText = `Activity • ${monthName}`;
  content.appendChild(heatTitle);

  const heatPanel = document.createElement('div');
  heatPanel.className = 'glass-panel';
  heatPanel.style.padding = '20px';
  
  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  grid.style.gap = '8px';
  
  // Heatmap Logic
  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      let intensity = 0;
      let totalHabits = state.habits.length || 1;
      let completedCount = 0;

      state.habits.forEach(h => {
          const log = state.habitLogs[`${dateStr}-${h.id}`];
          if (log && log.completed) completedCount++;
      });
      if (completedCount > 0) intensity = completedCount / totalHabits;

      // Styles
      const isToday = dateStr === state.currentDate;
      let bgStyle = `rgba(255,255,255,0.03)`;
      let borderStyle = '1px solid transparent';
      
      if (intensity > 0) {
          bgStyle = `rgba(0, 255, 140, ${0.2 + (intensity * 0.8)})`;
          borderStyle = `1px solid rgba(0,255,140,${0.5})`;
      }
      
      if (isToday) {
          borderStyle = '1px solid #fff';
      }

      const div = document.createElement('div');
      div.className = 'heat-box-wrapper';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';

      div.innerHTML = `
        <div class="heat-box" style="width:100%; aspect-ratio:1; border-radius:6px; background:${bgStyle}; border:${borderStyle}; ${intensity > 0 ? 'box-shadow:0 0 10px rgba(0,255,140,0.3);' : ''} transition:all 0.3s;"></div>
        <span style="font-size:0.6rem; margin-top:4px; color:${isToday ? '#fff' : 'rgba(255,255,255,0.3)'};">${i}</span>
      `;
      grid.appendChild(div);
  }

  heatPanel.appendChild(grid);
  content.appendChild(heatPanel);
  container.appendChild(content);
  
  // EVENT LISTENERS
  setTimeout(() => {
    document.getElementById('settings-trigger').onclick = () => window.openModal('settings-modal');
    
    // Auto-save debounced
    let timeout;
    const saveProfile = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            store.updateUser({
                name: document.getElementById('edit-name').value,
                tagline: document.getElementById('edit-tagline').value
            });
            window.showToast("Profile Updated");
        }, 500);
    };
    
    document.getElementById('edit-name').oninput = saveProfile;
    document.getElementById('edit-tagline').oninput = saveProfile;
  }, 0);

  return container;
}
