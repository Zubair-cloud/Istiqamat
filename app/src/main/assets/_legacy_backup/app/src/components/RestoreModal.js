import { BackupService } from '../utils/backup.js';

export function RestoreModal() {
  const modal = document.createElement('div');
  modal.className = `
    fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm 
    flex items-center justify-center p-4
    animate-in fade-in duration-200
  `;

  const content = document.createElement('div');
  content.className = `
    bg-surface w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden
    flex flex-col max-h-[90vh]
  `;
  modal.appendChild(content);

  // Header
  const header = document.createElement('div');
  header.className = 'p-4 border-b border-white/10 flex justify-between items-center';
  header.innerHTML = '<h3 class="font-bold text-lg">Restore Data</h3>';
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<i class="ph ph-x text-xl text-gray-400"></i>';
  closeBtn.onclick = () => modal.remove();
  header.appendChild(closeBtn);
  content.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'p-4 space-y-4 overflow-y-auto';
  
  body.innerHTML = `
    <p class="text-sm text-gray-400">
      Paste the backup code you copied from WhatsApp or load the .txt file.
    </p>
    <textarea 
      id="restoreInput"
      placeholder="Paste backup code here..." 
      class="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-[var(--color-primary)] resize-none"
    ></textarea>
  `;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'p-4 pt-0 flex gap-2';

  const pasteBtn = document.createElement('button');
  pasteBtn.className = 'flex-1 py-3 bg-surface border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/5';
  pasteBtn.innerText = 'Paste from Clipboard';
  pasteBtn.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      body.querySelector('#restoreInput').value = text;
    } catch (e) {
      alert("Please paste manually.");
    }
  };

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'flex-1 py-3 bg-[var(--color-primary)] text-black rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/20';
  confirmBtn.innerText = 'Restore Now';
  confirmBtn.onclick = () => {
    const code = body.querySelector('#restoreInput').value;
    if (!code.trim()) {
      alert("Please paste code first!");
      return;
    }
    if (confirm("This will overwrite current data. Sure?")) {
        BackupService.restoreFromString(code);
        modal.remove();
    }
  };

  actions.appendChild(pasteBtn);
  actions.appendChild(confirmBtn);
  content.appendChild(body);
  content.appendChild(actions);

  return modal;
}
