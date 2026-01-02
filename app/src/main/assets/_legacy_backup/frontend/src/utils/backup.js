import { store } from '../stores/store.js';

// Export Data to Txt String (Base64 encoded for safety, or raw JSON)
export const exportToString = () => {
    const data = store.get();
    const backupObj = {
      app: "Istiqamat",
      version: "v3",
      timestamp: Date.now(),
      data: data
    };
    return JSON.stringify(backupObj, null, 2);
};

// Trigger Native Share
export const backupData = () => {
    const backupString = exportToString();
    if (window.Android && window.Android.shareBackup) {
       // We can send this string. Native side should save as .txt and share.
       window.Android.shareBackup(backupString);
    } else {
       console.warn("Native share not available. Copying to clipboard instead.");
       copyToClipboard(backupString);
    }
};

// Restore from String
export const restoreData = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Basic Validation
      if (!parsed.data && !parsed.habits) {
        throw new Error("Invalid backup format");
      }

      const dataToRestore = parsed.data || parsed; // Support wrapped or raw
      
      store.set(dataToRestore);
      alert("✅ Data Restored Successfully!");
      location.reload(); 
      
    } catch (e) {
      alert("❌ Restore Failed: " + e.message);
    }
};

export const wipeData = () => {
    if(confirm("⚠️ ARE YOU SURE? This will delete ALL your data forever!")) {
        localStorage.clear();
        location.reload();
    }
};

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Backup copied to clipboard!");
    }).catch(err => {
      console.error('Async: Could not copy text: ', err);
    });
};

export const BackupService = {
  exportToString,
  shareBackup: backupData,
  restoreFromString: restoreData,
  copyToClipboard
};
