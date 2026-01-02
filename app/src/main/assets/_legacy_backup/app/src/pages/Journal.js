export function Journal() {
  const container = document.createElement('div');
  container.className = 'p-4 pb-24 text-center py-20 text-gray-400';
  container.innerHTML = `
    <i class="ph-duotone ph-book-open text-4xl mb-4 text-[var(--color-primary)]"></i>
    <h2 class="text-xl font-bold text-white">Journal Coming Soon</h2>
    <p>Track your thoughts and reflections.</p>
  `;
  return container;
}
