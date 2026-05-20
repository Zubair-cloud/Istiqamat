# Istiqamat - Agent Context & Project History

## Project Overview
- **Name:** Istiqamat
- **Architecture:** Hybrid WebApp wrapped in an Android WebView. The UI is built with HTML/CSS/JS (`assets/index.html`), while device-specific functionality (Notifications, Backup, AdMob, Google Login) is bridged to Android native (`MainActivity.kt`) via `JavascriptInterface` (named "Android").
- **Current State:** Both Phase 1 (Backup/Restore SAF Integration) and Phase 2 (Google Login Modernization via CredentialManager) are fully completed, verified, and compiled.
  - Implemented `ActivityResultContracts.CreateDocument` (SAF) and `pendingBackupData` cache inside `MainActivity.kt` for secure and customizable backup storage.
  - Migrated Google Login from deprecated `GoogleSignInClient` to the modern `CredentialManager` API with robust exception handling and informative developer hints.
  - Verified and successfully compiled the full codebase.

## Resolved Issues
1. **Backup File Not Present:** Resolved by replacing direct silent `MediaStore.Downloads` saving with the Storage Access Framework (`ACTION_CREATE_DOCUMENT`), displaying a user-friendly system file picker.
2. **Google Login Not Working:** Resolved by migrating from the deprecated `GoogleSignInClient` to Android's modern, bottom-sheet-driven `CredentialManager` API, including clear debugging logs/Toasts to highlight potential developer SHA-1 mismatch configuration errors.

## Implementation Plan to Fix Current Issues

### 1. Fix Backup/Restore using Storage Access Framework
- **What to do:** Instead of silently inserting into `MediaStore.Downloads`, use `Intent(Intent.ACTION_CREATE_DOCUMENT)`.
- **Why:** This opens the native Android file picker, allowing the user to explicitly choose where to save the `istiqamat_backup.json` file. It works securely on all Android versions without requiring broad storage permissions.
- **Changes needed:**
  - Add `pendingBackupData: String?` in `MainActivity.kt`.
  - Add a `ActivityResultLauncher` for creating the document.
  - Modify `WebAppInterface.backupData(jsonData: String)` to trigger the launcher.

### 2. Modernize Google Login with CredentialManager
- **What to do:** Replace the deprecated `GoogleSignIn` API with Android's modern `CredentialManager` API. Add robust error handling to display exact failure reasons (e.g., missing SHA-1).
- **Why:** `CredentialManager` is the recommended way to handle Google Sign-in on Android 14+. It provides a smoother bottom-sheet UI and handles authentication tokens securely.
- **Changes needed:**
  - Update `app/build.gradle.kts` to include `androidx.credentials:credentials` and `androidx.credentials:credentials-play-services-auth`.
  - Refactor `MainActivity.kt`'s `triggerSignInIfNeeded` to use `CredentialManager.getCredential()`.
  - Pass the retrieved ID token to `firebaseAuthWithGoogle()`.

## Developer Notes
- *To resume context in future chats, read this file first.*
