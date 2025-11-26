
import os

file_path = r"c:\Users\Shaik\AndroidStudioProjects\Istiqamat\app\src\main\assets\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Jubbu -> User
content = content.replace('>Jubbu<', '>User<')
content = content.replace('name: "Jubbu"', 'name: "User"')

# 2. Remove Time Travel HTML
# Find the block
start_marker = '<!-- Time Travel / Debug Section -->'
end_marker = '<span class="section-title">Active Habits</span>'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # Keep the end_marker, remove everything before it up to start_marker
    # Actually, let's be precise.
    # The block ends with </div> before the next section title.
    # But simpler to just remove the specific lines if we can identify them.
    # Let's use the markers I saw in the file.
    
    # Construct the exact string to remove is risky if whitespace differs.
    # Let's use the start/end indices.
    # The Time Travel section is followed by "Active Habits".
    # I will remove from start_marker up to (but not including) end_marker.
    content = content[:start_idx] + content[end_idx:]

# 3. Remove Time Travel JS functions
# function handleDateChange() ...
# function resetToToday() ...
# function handleDateChangeTo(targetDate) ...
# These are contiguous.
js_start = 'function handleDateChange() {'
js_end = 'function checkMissedDays(lastDateStr, newDateStr) {'

start_js = content.find(js_start)
end_js = content.find(js_end)

if start_js != -1 and end_js != -1:
    content = content[:start_js] + content[end_js:]

# 4. Remove simulated-date-input line
line_to_remove = "document.getElementById('simulated-date-input').value = appData.currentDate;"
content = content.replace(line_to_remove, "")

# 5. Fix renderHeatmap
# The function is malformed. I will replace the whole function with the correct version.
# I need to find where it starts and where the NEXT function starts.
heatmap_start = 'function renderHeatmap() {'
heatmap_next = 'function showConfirm(title, message, onConfirm) {'

# Wait, in the corrupted file, saveProfile is repeated?
# Let's look for the start of renderHeatmap and the start of showConfirm.
h_start = content.find(heatmap_start)
c_start = content.find(heatmap_next)

if h_start != -1 and c_start != -1:
    # Construct correct function
    correct_heatmap = """function renderHeatmap() {
            const grid = document.getElementById('heatmap');
            grid.innerHTML = '';

            const current = new Date(appData.currentDate);
            const year = current.getFullYear();
            const month = current.getMonth(); // 0-11
            const monthName = current.toLocaleString('default', { month: 'long' });

            // Update Header
            document.getElementById('heatmap-title').innerText = `Activity - ${monthName} ${year}`;

            // Calculate total days in month
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

                // Check activity intensity
                let intensity = 0;
                let totalHabits = appData.habits.length || 1;
                let completedCount = 0;

                appData.habits.forEach(h => {
                    const log = appData.habitLogs[`${dateStr}-${h.id}`];
                    if (log && log.completed) completedCount++;
                });
                if (completedCount > 0) intensity = completedCount / totalHabits;

                // Styles
                const isToday = dateStr === appData.currentDate;
                let bgStyle = `rgba(255,255,255,0.05)`;
                if (intensity > 0) {
                    bgStyle = `rgba(0, 255, 140, ${0.3 + (intensity * 0.7)})`;
                }

                const div = document.createElement('div');
                div.className = 'heat-box-wrapper';

                // Special Label for 1st Day
                let labelText = i;
                if (i === 1) labelText = `${i} ${monthName.substring(0, 3)}`;

                div.innerHTML = `
                <div class="heat-box ${isToday ? 'today' : ''}" style="background:${bgStyle}; ${intensity > 0 ? 'box-shadow:0 0 5px var(--neon-green);' : ''}"></div>
                <span class="heat-label" style="${isToday ? 'color:var(--neon-cyan); font-weight:bold;' : ''}">${labelText}</span>
                `;
                grid.appendChild(div);
            }
        }
        
        // Removed duplicate saveProfile
    """
    
    # Replace the block
    content = content[:h_start] + correct_heatmap + "\n    let confirmCallback = null;\n    " + content[c_start + len("    let confirmCallback = null;\n    "):] 
    # Wait, showConfirm is preceded by confirmCallback variable.
    # In the file:
    # 1613:     let confirmCallback = null;
    # 1614:     function showConfirm...
    
    # So I should replace up to `let confirmCallback`
    
    next_block_start = 'let confirmCallback = null;'
    n_start = content.find(next_block_start)
    
    if n_start != -1:
         content = content[:h_start] + correct_heatmap + "\n    " + content[n_start:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File fixed successfully!")
