import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the switchManageTab function and replace it.
# It might be in a state where it was partially updated or just broken.
# Let's define the correct function.

correct_function = """        function switchManageTab(tab) {
            // Update Tab UI
            document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
            // Find the tab button that corresponds to the clicked tab
            // This is a bit tricky without ID, but we can rely on onclick attributes or just set active class on click (which is passed as 'this' usually, but here we pass string)
            // Let's assume the buttons have onclick="switchManageTab('habits')" etc.
            // We can select by text content or attribute.
            const tabs = document.querySelectorAll('.manage-tab');
            if (tab === 'habits') tabs[0].classList.add('active');
            if (tab === 'journal') tabs[1].classList.add('active');
            if (tab === 'events') tabs[2].classList.add('active');

            // Hide all sections first
            document.getElementById('manage-habits-section').style.display = 'none';
            document.getElementById('manage-journal-section').style.display = 'none';
            document.getElementById('manage-events-section').style.display = 'none';

            // Show selected section and render content
            if (tab === 'habits') {
                document.getElementById('manage-habits-section').style.display = 'block';
                renderManageList();
            } else if (tab === 'journal') {
                document.getElementById('manage-journal-section').style.display = 'block';
                renderJournalHistory();
            } else if (tab === 'events') {
                document.getElementById('manage-events-section').style.display = 'block';
                renderEvents();
            }
        }"""

# Search for the existing function.
# It likely starts with `function switchManageTab(tab) {`
# We will use regex or simple search to find the block.
# Since we don't know the exact content, we'll search for the start and the closing brace?
# That's risky.
# Let's try to find the start, and assume it ends before the NEXT function.
# The next function is likely `openEditModal` or `renderManageList` or something.
# Wait, `switchManageTab` is usually near the bottom or near `renderManageList`.

# Let's look for a unique string inside the OLD function if possible.
# Or just replace the whole file content if we can identify the range.

# Let's try to find `function switchManageTab(tab) {`
start_marker = "function switchManageTab(tab) {"
start_idx = content.find(start_marker)

if start_idx != -1:
    # Found it. Now find the end.
    # It ends before the next function or script end.
    # Let's assume it ends before `function` keyword or `</script>`?
    # No, that's too broad.
    # Let's count braces.
    
    idx = start_idx + len(start_marker)
    brace_count = 1
    while brace_count > 0 and idx < len(content):
        if content[idx] == '{':
            brace_count += 1
        elif content[idx] == '}':
            brace_count -= 1
        idx += 1
    
    end_idx = idx
    
    # Replace the block
    new_content = content[:start_idx] + correct_function + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated switchManageTab function.")

else:
    # If not found, maybe it was named differently or I missed it.
    # Let's try to append it if it's missing?
    # But it should be there.
    # Let's try to find `function renderManageList() {` and insert BEFORE it?
    # Or just print error.
    print("Could not find switchManageTab function to replace.")
