const MESSAGES = {
    normal: {
        habit_done: "Great Job! 🎉",
        points_gained: "Great Job! +{pts} Points 🌟",
        habit_undone: "Undone. Keep going! 💪",
        goal_reached: "Goal Reached! 🔥",
        new_habit: "New Habit Added! ✨",
        habit_deleted: "Habit Deleted 🗑️",
        habit_updated: "Habit Updated! ✏️",
        profile_updated: "Profile Updated ✅",
        shield_bought: "Shield Equipped! 🛡️",
        shield_need_points: "Need 500 Points!",
        journal_saved: "Journal Saved 📔",
        backup_saved: "Backup saved 💾",
        restore_done: "Data Restored 🔄",
        item_bought: "Purchased {item}! 🛍️",
        habit_reminder: "Time for {habit}! Let's do this! ⏰"
    },
    sarcastic: {
        habit_done: "Finally... 🙄",
        points_gained: "Finally... +{pts}. Took you long enough. 🐌",
        habit_undone: "Giving up already? Typical. 🤡",
        goal_reached: "Oh look, you actually finished something. 😒",
        new_habit: "Another habit you'll probably ignore. 🗑️",
        habit_deleted: "Good riddance. 👋",
        habit_reminder: "Oh look, it's {habit} time. Don't ignore me. 😒",
        habit_updated: "Changed your mind again? 🥱",
        profile_updated: "New name, same procrastinator. 🤥",
        shield_bought: "Buying safety? Coward. (-500) 🛡️",
        shield_need_points: "You can't even afford a virtual shield. 😂",
        journal_saved: "Dear Diary... whatever. 📓",
        backup_saved: "Saved your failures for later. 💾",
        restore_done: "Restored your mess. 🧹"
    },
    premium: {
        habit_done: "Excellent work. 👑",
        points_gained: "Excellent work, Achiever. +{pts} Points 🚀",
        habit_undone: "Correction applied. Stay focused. ⚔️",
        goal_reached: "Milestone Achieved. You are unstoppable. ✨",
        new_habit: "A new commitment to excellence. 🏛️",
        habit_deleted: "Optimizing your workflow. ⚡",
        habit_reminder: "Execute {habit}. Discipline is destiny. ⚔️",
        habit_updated: "Refining your path. 🔱",
        profile_updated: "Identity calibrated. 🕶️",
        shield_bought: "Protection acquired. Wise choice. 🛡️",
        shield_need_points: "Requires more dedication (500 Points). 🔒",
        journal_saved: "Legacy recorded. 📜",
        backup_saved: "Archives secured. 🏦",
        restore_done: "State restored successfully. ♻️"
    }
};

function getMsg(key, params = {}) {
    const mode = (appData.user && appData.user.mode) ? appData.user.mode : 'normal';
    let text = MESSAGES[mode][key] || MESSAGES['normal'][key] || "Done";
    
    // Simple template replacement
    for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(`{${pKey}}`, pVal);
    }
    return text;
}
