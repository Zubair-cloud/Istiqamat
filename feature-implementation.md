# Feature Implementation Plan: Istiqamat App Enhancements

This document outlines the design and technical steps for implementing the new features in the **Istiqamat** Android wrapper app.

---

## 1. Calendar/Heatmap Completed Habits Selection

### Goal
Allow the user to tap any specific date block inside the Activity Calendar (Heatmap) on the **Profile** screen to view a detailed, premium list of habits and their completion statuses for that date.

### Technical Implementation

#### A. Frontend Changes (`app/src/main/assets/index.html`)
- Add a new modal overlay structure for viewing completed habits:
  ```html
  <!-- COMPLETED HABITS MODAL -->
  <div class="modal-overlay" id="completed-habits-modal">
      <div class="glass-panel add-modal" style="max-height: 80vh; overflow-y: auto;">
          <h2 id="completed-modal-title" style="margin-bottom:20px; font-size:1.3rem; color:#fff;">Habits for Date</h2>
          <div id="completed-habits-list" style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
              <!-- Populated by JS -->
          </div>
          <button class="btn-primary" style="background:rgba(255,255,255,0.1); color:#fff; width:100%; border-radius:12px;"
              onclick="closeCompletedHabitsModal()">Close</button>
      </div>
  </div>
  ```

#### B. Heatmap Interaction (`app/src/main/assets/js/ui.js`)
- Update `renderHeatmap()` to add a `cursor:pointer` style and an `onclick="showCompletedHabitsForDate('${dateStr}')"` event listener to each `.heat-box` element.

#### C. Modal Logic & Rendering (`app/src/main/assets/js/ui.js`)
- Implement two new JavaScript functions to manage the new modal:
  1. `showCompletedHabitsForDate(dateStr)`:
     - Formats the selected date into a beautiful, localized string (e.g., `Wed, May 20, 2026`).
     - Queries `appData.habits` and looks up completion logs in `appData.habitLogs` using the key `${dateStr}-${habitId}`.
     - Dynamically renders each habit's details (Title, Type, Completion Status, Progress count if numeric) in a beautiful, glassmorphic layout.
     - Adds vibrant Phosphor icons (`ph-check-circle` for completed habits with a green glow, `ph-circle` for incomplete ones).
     - Displays a friendly motivation message if no habits are completed or defined yet.
     - Opens the overlay.
  2. `closeCompletedHabitsModal()`: Closes the overlay with clean fade animations.

---

## 2. Update Add Habit Modal Placeholder

### Goal
Change the placeholder text for the "Habit Name" input inside the New Habit modal.

### Technical Implementation
- Open `app/src/main/assets/index.html` at line 263.
- Locate:
  ```html
  <input type="text" id="new-habit-name" placeholder="e.g., Read Quran">
  ```
- Change it to:
  ```html
  <input type="text" id="new-habit-name" placeholder="e.g., Learning new to">
  ```

---

## Verification Plan

1. **Local Preview / Browser Verification**:
   - Verify layout and modal behavior by simulating clicks on different days.
2. **Device Deployment**:
   - Compile and run the wrapper app using standard Android tools.
   - Confirm that the FAB works, the new placeholder displays correctly, and clicking any date on the Profile tab displays the correct completions.
