import { store } from '../stores/store.js';

export function Manage() {
  const container = document.createElement('div');
  container.className = 'screen active';
  container.id = 'manage-screen';

  const state = store.get();

  // HEADER
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
      <h1>Manage</h1>
      <div class="points-badge profile-points-display">${state.user.points} 💎</div>
  `;
  container.appendChild(header);

  const content = document.createElement('div');
  content.className = 'content-area';

  // TABS
  const tabContainer = document.createElement('div');
  tabContainer.className = 'manage-tabs';
  tabContainer.innerHTML = `
    <div class="manage-tab active" id="tab-habits">Habits</div>
    <div class="manage-tab" id="tab-journal">Journal</div>
  `;
  content.appendChild(tabContainer);

  // SECTIONS CONTAINER
  const habitsSection = document.createElement('div');
  habitsSection.id = 'manage-habits-section';
  
  const journalSection = document.createElement('div');
  journalSection.id = 'manage-journal-section';
  journalSection.style.display = 'none';

  // --- HABITS SECTION CONTENT ---
  // Time Travel
  const timeTravelDiv = document.createElement('div');
  timeTravelDiv.innerHTML = `
     <span class="section-title">Time Travel (Testing)</span>
     <div class="glass-panel" style="padding:20px; margin-bottom:20px;">
        <p style="color:#aaa; font-size:0.8rem; margin-bottom:10px;">Change date to simulate future or past.</p>
        <div class="input-group">
            <label>Simulate Date</label>
            <input type="date" id="simulated-date-input" value="${state.currentDate}">
        </div>
        <button class="btn-primary" id="reset-today-btn">Back to Today</button>
     </div>
  `;
  habitsSection.appendChild(timeTravelDiv);

  // Active Habits List
  const listTitle = document.createElement('span');
  listTitle.className = 'section-title';
  listTitle.innerText = 'Active Habits';
  habitsSection.appendChild(listTitle);

  const tips = document.createElement('p');
  tips.style = "font-size:0.8rem; color:#aaa; margin-bottom:10px;";
  tips.innerText = "Tap on any habit to Edit details.";
  habitsSection.appendChild(tips);

  const list = document.createElement('div');
  if (state.habits.length === 0) {
      list.innerHTML = `<p style="text-align:center; color:#666; margin-top:20px;">Nothing to manage.</p>`;
  } else {
      state.habits.forEach(h => {
          const timeText = h.time ? `• ${h.time}` : '';
          const card = document.createElement('div');
          card.className = 'glass-panel habit-card';
          card.style.cursor = 'pointer';
          card.onclick = () => {
             document.getElementById('edit-habit-id').value = h.id;
             document.getElementById('edit-habit-name').value = h.title;
             document.getElementById('edit-habit-time').value = h.time || '';
             
             const targetGroup = document.getElementById('edit-target-group');
             if (h.type === 'counter') {
                 targetGroup.style.display = 'block';
                 document.getElementById('edit-habit-target').value = h.target;
             } else {
                 targetGroup.style.display = 'none';
             }
             window.openModal('edit-modal');
          };

          card.innerHTML = `
            <div class="habit-info">
                <i class="ph-fill ${h.icon} habit-icon"></i>
                <div class="habit-text">
                    <h3>${h.title}</h3>
                    <p style="color:#aaa;">${h.type} ${timeText}</p>
                </div>
            </div>
          `;
          
          const delBtn = document.createElement('button');
          delBtn.className = 'delete-btn';
          delBtn.innerHTML = '<i class="ph-bold ph-trash" style="font-size:1.2rem;"></i>';
          delBtn.onclick = (e) => {
              e.stopPropagation();
              if(confirm("Delete this habit?")) {
                  const newHabits = store.get().habits.filter(x => x.id !== h.id);
                  store.set({ habits: newHabits });
                  window.showToast("Habit Deleted");
              }
          };
          
          card.appendChild(delBtn);
          list.appendChild(card);
      });
  }
  habitsSection.appendChild(list);


  // --- JOURNAL SECTION CONTENT ---
  const journalPanel = document.createElement('div');
  journalPanel.className = 'glass-panel';
  journalPanel.style.padding = '20px';
  journalPanel.style.marginBottom = '20px';
  journalPanel.innerHTML = `
    <div class="input-group">
        <label>Journal Date</label>
        <input type="date" id="journal-date-input" value="${state.currentDate}">
    </div>
    <textarea id="journal-text" rows="6" placeholder="Write your thoughts..." style="width:100%; resize:none; margin-bottom:10px;"></textarea>
    <button class="btn-primary" id="save-journal-btn">Save Entry</button>
  `;
  journalSection.appendChild(journalPanel);
  
  // Journal History Placeholder
  const jHistoryTitle = document.createElement('span');
  jHistoryTitle.className = 'section-title';
  jHistoryTitle.innerText = 'Recent Entries';
  journalSection.appendChild(jHistoryTitle);
  
  const jHistoryList = document.createElement('div');
  jHistoryList.className = 'glass-panel';
  jHistoryList.style.minHeight = '100px';
  
  const dates = Object.keys(state.journal).sort().reverse().slice(0, 5);
  if(dates.length === 0) {
      jHistoryList.innerHTML = `<p style="text-align:center; color:#666; padding:20px; font-size:0.8rem;">No entries yet.</p>`;
  } else {
      dates.forEach(d => {
           jHistoryList.innerHTML += `
            <div style="padding:15px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:0.8rem; color:var(--neon-cyan); margin-bottom:5px;">${new Date(d).toDateString()}</div>
                <div style="font-size:0.95rem; line-height:1.4; white-space:pre-wrap;">${state.journal[d]}</div>
            </div>`;
      });
  }
  journalSection.appendChild(jHistoryList);


  content.appendChild(habitsSection);
  content.appendChild(journalSection);
  container.appendChild(content);

  // EVENT LISTENERS
  setTimeout(() => {
     const tabHabits = document.getElementById('tab-habits');
     const tabJournal = document.getElementById('tab-journal');
     
     tabHabits.onclick = () => {
         tabHabits.classList.add('active'); tabJournal.classList.remove('active');
         habitsSection.style.display = 'block'; journalSection.style.display = 'none';
     };
     
     tabJournal.onclick = () => {
         tabJournal.classList.add('active'); tabHabits.classList.remove('active');
         journalSection.style.display = 'block'; habitsSection.style.display = 'none';
         
         // Load current journal text
         const date = document.getElementById('journal-date-input').value;
         document.getElementById('journal-text').value = store.get().journal[date] || "";
     };

     // Journal Save
     document.getElementById('save-journal-btn').onclick = () => {
         const date = document.getElementById('journal-date-input').value;
         const text = document.getElementById('journal-text').value;
         const j = { ...store.get().journal };
         j[date] = text;
         store.set({ journal: j });
         window.showToast("Journal Saved");
     };
     
     // Journal Date Change
     document.getElementById('journal-date-input').onchange = (e) => {
         const date = e.target.value;
         document.getElementById('journal-text').value = store.get().journal[date] || "";
     };

     // Time Travel
     document.getElementById('simulated-date-input').onchange = (e) => {
         const date = e.target.value;
         store.set({ currentDate: date });
         window.location.reload(); // Simple reload to re-render everything with new date
     };
     document.getElementById('reset-today-btn').onclick = () => {
         store.set({ currentDate: new Date().toISOString().split('T')[0] });
         window.location.reload();
     };
     
  }, 0);

  return container;
}
