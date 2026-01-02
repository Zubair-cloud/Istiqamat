// Store Data Wrapper
const STORE_KEY = 'istiqamat_data_v3';

const defaultData = {
  user: { name: "User", tagline: "Consistent Believer", points: 0, shields: 0 },
  habits: [
      { id: 1, title: "Fajr Namaz", icon: "ph-mosque", type: "simple", streak: 0, time: "05:30" },
      { id: 2, title: "Drink Water", icon: "ph-drop", type: "counter", streak: 0, target: 8, time: "" }
  ],
  habitLogs: {}, // Key: "YYYY-MM-DD-HabitID"
  journal: {}, // Key: "YYYY-MM-DD"
  history: [], // [{desc, amount, date}]
  currentDate: new Date().toISOString().split('T')[0],
  lastLoginDate: new Date().toISOString().split('T')[0]
};

let state = { ...defaultData };
let listeners = [];

export const store = {
  init() {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge logic (simplified) or just overwrite
        state = { ...defaultData, ...parsed };
        
        // Ensure new fields exist if migrating from old data
        if(!state.user.shields) state.user.shields = 0;
        if(!state.habitLogs) state.habitLogs = {};
        if(!state.journal) state.journal = {};
        
        // Ensure currentDate is valid
        if (!state.currentDate) state.currentDate = new Date().toISOString().split('T')[0];
        
      } catch (e) {
        console.error("Store corruption:", e);
      }
    }
    this.save();
    
    // Sync with Android if available
    if (window.Android && window.Android.syncData) {
        window.Android.syncData(JSON.stringify(state));
    }
  },

  get() { return state; },

  set(newState) {
    state = { ...state, ...newState };
    this.save();
    this.notify();
  },

  updateUser(updates) {
    state.user = { ...state.user, ...updates };
    this.save();
    this.notify();
  },

  addHistory(desc, amount) {
    state.history.unshift({ desc, amount, date: state.currentDate });
    if (state.history.length > 50) state.history.pop();
    this.save();
  },

  save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  },

  subscribe(listener) {
    listeners.push(listener);
    return () => listeners = listeners.filter(l => l !== listener);
  },

  notify() {
    listeners.forEach(l => l(state));
  }
};
