export const themes = {
  default: {
    name: 'Default',
    colors: {
      '--color-primary': '#00ff8c', // Neon Green
      '--color-secondary': '#00f5ff', // Neon Cyan
      '--color-bg': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-text': '#ffffff'
    }
  },
  royalGold: {
    name: 'Royal Gold',
    colors: {
      '--color-primary': '#FFD700', // Gold
      '--color-secondary': '#B8860B', // Dark Golden Rod
      '--color-bg': '#000000', // Pure Black
      '--color-surface': '#1a1a1a', // Dark Gray
      '--color-text': '#FFD700'
    }
  },
  red: {
    name: 'Red Theme',
    colors: {
      '--color-primary': '#FF4444', // Red
      '--color-secondary': '#8B0000', // Dark Red
      '--color-bg': '#1a0505', // Very Dark Red/Black
      '--color-surface': '#2d0a0a',
      '--color-text': '#ffffff'
    }
  }
};

export function applyTheme(themeKey) {
  const theme = themes[themeKey] || themes.default;
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  localStorage.setItem('istiqamat_theme', themeKey);
}

export function loadSavedTheme() {
  const saved = localStorage.getItem('istiqamat_theme');
  if (saved && themes[saved]) {
    applyTheme(saved);
  } else {
    applyTheme('default');
  }
}
