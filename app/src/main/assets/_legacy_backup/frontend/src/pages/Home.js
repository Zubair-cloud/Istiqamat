import { store } from '../stores/store.js';

export function Home() {
  const container = document.createElement('div');
  container.className = 'screen active';
  container.id = 'home-screen';

  // State
  const state = store.get();
  
  // HEADER
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
    <div class="user-greeting">
        <p>Assalamu Alaikum,</p>
        <h1 class="display-name">${state.user.name}</h1>
    </div>
    <div class="points-badge"><i class="ph-fill ph-diamond"></i><span id="points-display">${state.user.points}</span></div>
  `;
  container.appendChild(header);

  // STREAK HERO
  const maxStreak = Math.max(0, ...state.habits.map(h => h.streak || 0));
  const hero = document.createElement('div');
  hero.className = 'streak-hero-container';
  hero.innerHTML = `
    <div class="streak-hero-badge">
        <i class="ph-fill ph-fire fire-anim"></i>
        <div>
            <div class="streak-count-big">${maxStreak}</div>
            <div class="streak-label-small">Day Streak</div>
        </div>
    </div>
  `;
  container.appendChild(hero);

  // FLUID VESSEL
  const vesselSection = document.createElement('div');
  vesselSection.className = 'vessel-section';
  vesselSection.innerHTML = `
    <div class="container-wrap">
        <div class="glass-container">
            <div class="fluid" id="main-fluid">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
            </div>
        </div>
    </div>
  `;
  container.appendChild(vesselSection);
  
  // Calculate Fluid Height
  setTimeout(() => updateFluid(state), 50);

  // GOALS SECTION
  const goalsSection = document.createElement('div');
  goalsSection.className = 'content-area';
  
  const dateStr = new Date(state.currentDate).toDateString();
  const dateIndicator = document.createElement('div');
  dateIndicator.style.textAlign = 'center';
  dateIndicator.innerHTML = `<span class="date-indicator">${dateStr}</span>`;
  goalsSection.appendChild(dateIndicator);

  const title = document.createElement('span');
  title.className = 'section-title';
  title.innerText = 'Goals';
  goalsSection.appendChild(title);

  const habitsList = document.createElement('div');
  habitsList.id = 'habit-list';

  const habits = store.get().habits;
  
  if (habits.length === 0) {
     habitsList.innerHTML = `<p style="text-align:center; color:#666; margin-top:30px;">No habits yet. Click + to add.</p>`;
  } else {
    habits.forEach(habit => renderHabitCard(habitsList, habit));
  }
  
  goalsSection.appendChild(habitsList);
  container.appendChild(goalsSection);

  return container;
}

function renderHabitCard(parent, habit) {
  const card = document.createElement('div');
  card.className = `
    group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-1 
    hover:bg-white/10 transition-colors
  `;
  
  card.innerHTML = `
    <div class="relative z-10 flex items-center justify-between bg-[#0a0f1e]/80 backdrop-blur-xl rounded-[20px] p-4 pr-5">
       <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-[var(--neon-green)]/10 flex items-center justify-center border border-[var(--neon-green)]/20 text-[var(--neon-green)] shadow-[0_0_15px_rgba(0,255,140,0.1)]">
             <i class="ph-fill ${habit.icon || 'ph-check-circle'} text-xl"></i>
          </div>
          <div>
             <h4 class="font-bold text-white text-sm">${habit.title}</h4>
             <div class="flex items-center gap-2 mt-1">
               <span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/20">${habit.time || 'Anytime'}</span>
               <span class="text-[10px] text-gray-500">${habit.streak || 0} Streak</span>
             </div>
          </div>
       </div>
       
       <button class="checkbox-btn">
         <i class="ph-bold ph-check"></i>
       </button>
    </div>
    
    <!-- Neon Accent Line -->
    <div class="absolute left-0 top-4 bottom-4 w-1 bg-[var(--neon-green)] rounded-r-full shadow-[0_0_10px_var(--neon-green)]"></div>
  `;
  
  parent.appendChild(card);
  
  // Toggle Listener
  const btn = card.querySelector('button');
  
  // Check if fully completed for today
  const state = store.get();
  const key = `${state.currentDate}-${habit.id}`;
  const log = state.habitLogs[key];
  const isDone = log && log.completed;
  
  if (isDone) {
      card.classList.add('completed');
      btn.innerHTML = `<i class="ph-bold ph-arrow-counter-clockwise"></i>`; // Indicate undo
      btn.style.background = 'var(--text-muted)';
  }

  btn.onclick = (e) => {
      e.stopPropagation();
      
      const s = store.get();
      const logs = { ...s.habitLogs };
      const user = { ...s.user };
      const existing = logs[key];
      
      if (existing && existing.completed) {
          // UNDO
          delete logs[key];
          user.points = Math.max(0, user.points - 10); // Deduct points
          // Decrement streak? (Optional, might be complex if consistent)
          // For now, simple logic:
          const habits = [...s.habits];
          const hIndex = habits.findIndex(h => h.id === habit.id);
          if(habits[hIndex] && habits[hIndex].streak > 0) habits[hIndex].streak--;
          
          store.set({ habitLogs: logs, user: user, habits: habits });
          window.showToast('Unmarked');
      } else {
          // DO
          logs[key] = { completed: true, timestamp: Date.now() };
          user.points += 10;
          
          const habits = [...s.habits];
          const hIndex = habits.findIndex(h => h.id === habit.id);
          if(habits[hIndex]) habits[hIndex].streak = (habits[hIndex].streak || 0) + 1;
          
          store.set({ habitLogs: logs, user: user, habits: habits });
          window.showToast('+10 Points! 💎');
          
          // Trigger Liquid Update immediately for visuals (though re-render happens)
          updateFluid(store.get());
      }
  };
}

function updateFluid(state) {
    const fluid = document.getElementById('main-fluid');
    if (!fluid) return;

    // Calculate percentage based on completed habits for today
    const habits = state.habits || [];
    const today = state.currentDate;
    
    // Count matches in habitLogs for today
    // Note: Store.js habitLogs is Key: "YYYY-MM-DD-HabitID"
    // We need to check each habit
    let completed = 0;
    habits.forEach(h => {
        const key = `${today}-${h.id}`;
        if (state.habitLogs[key]) completed++;
    });

    const total = habits.length;
    let percentage = total === 0 ? 0 : (completed / total) * 100;
    
    // Clamp
    percentage = Math.min(100, Math.max(0, percentage));

    // Update Height
    fluid.style.height = `${percentage}%`;
    
    // Update Glow/Shadow only (Keep CSS Gradient)
    if (percentage < 30) {
        fluid.style.boxShadow = '0 0 20px var(--neon-red)';
    } else if (percentage < 70) {
        fluid.style.boxShadow = '0 0 20px var(--neon-orange)';
    } else {
        fluid.style.boxShadow = '0 0 30px var(--neon-green)';
    }
}
