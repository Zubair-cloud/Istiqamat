import { store } from '../stores/store.js';

export function Shop() {
  const container = document.createElement('div');
  container.className = 'screen active';
  container.id = 'shop-screen';

  const state = store.get();

  // HEADER
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
      <h1>Marketplace</h1>
      <div class="points-badge profile-points-display">${state.user.points} 💎</div>
  `;
  container.appendChild(header);

  const content = document.createElement('div');
  content.className = 'content-area';

  // WALLET CARD
  const wallet = document.createElement('div');
  wallet.className = 'glass-panel wallet-card';
  wallet.innerHTML = `
      <div class="wallet-stat">
          <h2 id="shop-total-points">${state.user.points}</h2>
          <p>Ajr Points</p>
      </div>
      <div style="height:40px; width:1px; background:rgba(255,255,255,0.2);"></div>
      <div class="wallet-stat">
          <h2 id="shop-total-shields" style="color:var(--neon-cyan); text-shadow:0 0 10px var(--neon-cyan);">${state.user.shields}</h2>
          <p>Shields Owned</p>
      </div>
  `;
  content.appendChild(wallet);

  // POWER-UPS TITLE
  const title1 = document.createElement('span');
  title1.className = 'section-title';
  title1.innerText = 'Power-ups';
  content.appendChild(title1);

  // SHIELD ITEM
  const shieldItem = document.createElement('div');
  shieldItem.className = 'glass-panel shop-item';
  shieldItem.innerHTML = `
      <i class="ph-fill ph-shield-check shop-item-icon"></i>
      <h3 style="font-size:1.2rem; margin-bottom:5px;">Streak Shield</h3>
      <p style="color:#aaa; font-size:0.85rem; margin-bottom:15px;">Prevents your streak from breaking if you miss a day.</p>
  `;
  
  const buyBtn = document.createElement('button');
  buyBtn.className = 'buy-btn';
  buyBtn.innerText = 'Buy for 500 💎';
  buyBtn.onclick = () => buyShield();
  shieldItem.appendChild(buyBtn);
  content.appendChild(shieldItem);

  // HISTORY TITLE
  const title2 = document.createElement('span');
  title2.className = 'section-title';
  title2.style.marginTop = '30px';
  title2.innerText = 'Transaction History';
  content.appendChild(title2);

  // HISTORY LIST
  const historyList = document.createElement('div');
  historyList.className = 'glass-panel';
  historyList.style.padding = '15px';
  historyList.style.minHeight = '100px';
  
  if (state.history.length === 0) {
      historyList.innerHTML = `<p style="text-align:center; color:#666; font-size:0.8rem;">No transactions yet.</p>`;
  } else {
      state.history.forEach(t => {
          const isPos = t.amount >= 0;
          const html = `
            <div class="history-item">
                <div class="hist-left" style="display:flex; gap:10px; align-items:center;">
                    <i class="ph-bold ${isPos ? 'ph-arrow-up-right' : 'ph-arrow-down-left'}" style="color:${isPos ? 'var(--neon-green)' : 'var(--danger)'}"></i>
                    <div>
                        <p style="font-size:0.9rem;">${t.desc}</p>
                        <p style="font-size:0.7rem; color:#aaa;">${t.date}</p>
                    </div>
                </div>
                <span class="hist-pts ${isPos ? 'hist-plus' : 'hist-minus'}" style="font-weight:bold;">${isPos ? '+' : ''}${t.amount}</span>
            </div>
          `;
          historyList.insertAdjacentHTML('beforeend', html);
      });
  }
  content.appendChild(historyList);
  container.appendChild(content);

  return container;
}

function buyShield() {
  const state = store.get();
  if (state.user.points >= 500) {
      store.updateUser({ 
          points: state.user.points - 500,
          shields: state.user.shields + 1 
      });
      store.addHistory("Bought Shield", -500);
      window.showToast("Shield Equipped! 🛡️");
  } else {
      window.showToast("Need 500 Points!");
  }
}
