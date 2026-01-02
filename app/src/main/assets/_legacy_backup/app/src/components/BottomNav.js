// Bottom Navigation Component matching Reference UI
export function BottomNav({ activeTab, onTabChange, onAddClick }) {
  const nav = document.createElement('div');
  nav.className = 'glass-panel bottom-nav';

  const tabs = [
    { id: 'home', icon: 'ph-house', label: 'Home' },
    { id: 'shop', icon: 'ph-storefront', label: 'Store' },
    { id: 'manage', icon: 'ph-list-dashes', label: 'Manage' },
    { id: 'profile', icon: 'ph-user', label: 'Profile' }
  ];

  tabs.slice(0, 2).forEach(tab => nav.appendChild(createNavItem(tab, activeTab, onTabChange)));

  // Center Spacer for FAB
  const spacer = document.createElement('div');
  spacer.style.width = '50px';
  nav.appendChild(spacer);

  tabs.slice(2).forEach(tab => nav.appendChild(createNavItem(tab, activeTab, onTabChange)));

  // FAB (Floating Action Button)
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.innerHTML = '<i class="ph-bold ph-plus"></i>';
  fab.onclick = onAddClick;
  
  // Return wrapper containing both Nav and FAB
  const wrapper = document.createElement('div');
  wrapper.appendChild(nav);
  wrapper.appendChild(fab);

  return wrapper;
}

function createNavItem(tab, activeTab, onTabChange) {
  const div = document.createElement('div');
  const isActive = activeTab === tab.id;
  div.className = `nav-item ${isActive ? 'active' : ''}`;
  div.onclick = () => onTabChange(tab.id);
  
  div.innerHTML = `
    <i class="ph-fill ${tab.icon}"></i>
    <span>${tab.label}</span>
  `;
  return div;
}
