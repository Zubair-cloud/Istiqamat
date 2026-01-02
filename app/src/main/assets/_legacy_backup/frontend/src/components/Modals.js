import { store } from '../stores/store.js';
import { backupData, restoreData, wipeData } from '../utils/backup.js';

export function createModals() {
  const container = document.createElement('div');

  // --- ADD HABIT MODAL ---
  container.innerHTML += `
    <div class="modal-overlay" id="add-modal">
        <div class="glass-panel add-modal">
            <h2 style="margin-bottom:20px;">New Habit</h2>
            <div class="input-group">
                <label>Habit Name</label>
                <input type="text" id="new-habit-name" placeholder="e.g., Read Quran">
            </div>
            <div class="input-group">
                <label>Type</label>
                <select id="new-habit-type">
                    <option value="simple">Simple (Done/Not Done)</option>
                    <option value="counter">Counter (e.g., 8 Bottles)</option>
                </select>
            </div>
            <div class="input-group" id="target-group" style="display:none;">
                <label>Target Count</label>
                <input type="number" id="new-habit-target" value="5">
            </div>
            <div class="input-group">
                <label>Time (Optional)</label>
                <input type="time" id="new-habit-time">
            </div>
            <div style="display:flex; gap:10px;">
                <button class="btn-primary" style="background:rgba(255,255,255,0.1); color:#fff;" onclick="closeModal('add-modal')">Cancel</button>
                <button class="btn-primary" id="save-new-habit-btn">Save Habit</button>
            </div>
        </div>
    </div>
  `;

  // --- EDIT HABIT MODAL ---
  container.innerHTML += `
    <div class="modal-overlay" id="edit-modal">
        <div class="glass-panel add-modal">
            <h2 style="margin-bottom:20px;">Edit Details</h2>
            <input type="hidden" id="edit-habit-id">
            <div class="input-group">
                <label>Habit Name</label>
                <input type="text" id="edit-habit-name">
            </div>
            <div class="input-group" id="edit-target-group" style="display:none;">
                <label>Target Count</label>
                <input type="number" id="edit-habit-target">
            </div>
            <div class="input-group">
                <label>Time (Optional)</label>
                <input type="time" id="edit-habit-time">
            </div>
            <div style="display:flex; gap:10px;">
                <button class="btn-primary" style="background:rgba(255,255,255,0.1); color:#fff;" onclick="closeModal('edit-modal')">Cancel</button>
                <button class="btn-primary" id="update-habit-btn">Update</button>
            </div>
        </div>
    </div>
  `;

  // --- SETTINGS MODAL ---
  container.innerHTML += `
    <div class="modal-overlay" id="settings-modal">
        <div class="glass-panel add-modal">
            <h2 style="margin-bottom:20px;">Settings</h2>
            <span class="section-title">Data Management</span>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 25px;">
                <!-- Backup -->
                <button id="backup-btn" class="glass-btn-vertical">
                    <div class="icon-circle" style="background:rgba(0,245,255,0.1); color:var(--neon-cyan);">
                        <i class="ph-bold ph-upload-simple"></i>
                    </div>
                    <span>Backup</span>
                </button>
                
                <!-- Restore -->
                <button onclick="document.getElementById('restore-file').click()" class="glass-btn-vertical">
                    <div class="icon-circle" style="background:rgba(255,0,200,0.1); color:#ff00c8;">
                        <i class="ph-bold ph-download-simple"></i>
                    </div>
                    <span>Restore</span>
                </button>
                
                <!-- Paste -->
                <button onclick="navigator.clipboard.readText().then(t => window.restoreFromClipboard(t))" class="glass-btn-vertical">
                    <div class="icon-circle" style="background:rgba(0,255,0,0.1); color:lime;">
                        <i class="ph-bold ph-clipboard-text"></i>
                    </div>
                    <span>Paste</span>
                </button>
                
                <input type="file" id="restore-file" style="display:none">
            </div>
            <button id="wipe-btn" style="width:100%; margin-top:10px; padding:15px; background:rgba(255,0,0,0.1); border:1px solid rgba(255,0,0,0.3); border-radius:15px; color:#ff4b4b; cursor:pointer;">
                <i class="ph-fill ph-trash"></i> Reset App Data
            </button>
            <button class="btn-primary" style="background:rgba(255,255,255,0.1); margin-top:20px;" onclick="closeModal('settings-modal')">Close</button>
        </div>
    </div>
  `;

  // --- BIND EVENTS AFTER MOUNT ---
  setTimeout(() => bindModalEvents(), 0);

  return container;
}

function bindModalEvents() {
  // Add Habit Logic
  const typeSelect = document.getElementById('new-habit-type');
  if (typeSelect) {
      typeSelect.onchange = () => {
          document.getElementById('target-group').style.display = typeSelect.value === 'counter' ? 'block' : 'none';
      };
  }

  document.getElementById('save-new-habit-btn').onclick = () => {
      const name = document.getElementById('new-habit-name').value;
      const type = document.getElementById('new-habit-type').value;
      const target = document.getElementById('new-habit-target').value;
      const time = document.getElementById('new-habit-time').value;

      if (!name) return alert("Enter name");
      
      const prevHabits = store.get().habits;
      const newHabit = {
          id: Date.now(),
          title: name,
          icon: "ph-star",
          type: type,
          streak: 0,
          target: type === 'counter' ? parseInt(target) : 0,
          time: time
      };
      
      store.set({ habits: [...prevHabits, newHabit] });
      closeModal('add-modal');
      window.showToast("Habit Added!");
  };

  // Update Habit Logic
  document.getElementById('update-habit-btn').onclick = () => {
      const id = parseInt(document.getElementById('edit-habit-id').value);
      const name = document.getElementById('edit-habit-name').value;
      const time = document.getElementById('edit-habit-time').value;
      const target = document.getElementById('edit-habit-target').value;

      const habits = [...store.get().habits];
      const h = habits.find(x => x.id === id);
      if (h) {
          h.title = name;
          h.time = time;
          if (h.type === 'counter') h.target = parseInt(target);
          store.set({ habits });
          closeModal('edit-modal');
          window.showToast("Habit Updated");
      }
  };

  // Settings Logic
  document.getElementById('backup-btn').onclick = () => backupData();
  
  const restoreInput = document.getElementById('restore-file');
  restoreInput.onchange = (e) => {
      const file = e.target.files[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = (ev) => restoreData(ev.target.result);
          reader.readAsText(file);
      }
  };
  
  // Custom Clipboard restore helper exposed to window
  window.restoreFromClipboard = (text) => restoreData(text);

  document.getElementById('wipe-btn').onclick = () => wipeData();
}

// Global helper required by inline clicks
window.closeModal = (id) => document.getElementById(id).classList.remove('open');
window.openModal = (id) => document.getElementById(id).classList.add('open');
