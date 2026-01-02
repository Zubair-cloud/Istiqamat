import { store } from './src/stores/store.js';
import { Home } from './src/pages/Home.js';
import { Shop } from './src/pages/Shop.js';
import { Manage } from './src/pages/Manage.js';
import { Profile } from './src/pages/Profile.js';
import { BottomNav } from './src/components/BottomNav.js';
import { createModals } from './src/components/Modals.js';

// Global Toast (Must exist for components to use)
window.showToast = (msg) => {
    let t = document.getElementById('toast');
    if(!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'toast';
        t.innerHTML = '<span id="toast-msg"></span>';
        document.body.appendChild(t);
    }
    const msgSpan = document.getElementById('toast-msg');
    msgSpan.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
};

const app = document.getElementById('app');
let activeTab = 'home';

function render() {
  app.innerHTML = '';
  
  // 1. Determine Page
  let pageComponent;
  switch(activeTab) {
      case 'home': pageComponent = Home(); break;
      case 'shop': pageComponent = Shop(); break;
      case 'manage': pageComponent = Manage(); break;
      case 'profile': pageComponent = Profile(); break;
      default: pageComponent = Home();
  }
  
  app.appendChild(pageComponent);

  // 2. Add Bottom Nav
  app.appendChild(BottomNav({
      activeTab,
      onTabChange: (tab) => {
          activeTab = tab;
          render(); // Re-render whole app on tab switch
      },
      onAddClick: () => window.openModal('add-modal')
  }));

  // 3. Add Modals (Always present)
  app.appendChild(createModals());
}

async function init() {
  store.init();
  
  // Sub to store changes to re-render UI if data changes
  store.subscribe(() => {
     // Optimization: Ideally we'd diff, but for now we re-render current page
     // However, input focus loss is an issue with full re-render.
     // For this simple app, we can re-render on major nav changes, 
     // but for data updates (like checkboxes), components handle self-update or we resort to this.
     
     // IMPORTANT: We only re-render if we are NOT editing text inputs prevents focus loss
     if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
         render();
     }
  });

  render();
}

init(); // Full re-render on state change (maybe too heavy, relying on page internal updates is better)
