import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
delete_event_fixed = False
skip_until_brace = False

for line in lines:
    if skip_until_brace:
        if '}' in line and 'function' not in line: # End of function roughly
             # This is risky if there are nested braces.
             # Better to just replace the known block.
             pass
        # Actually, let's just skip the lines we know are there.
        # But since I don't know exactly how many lines, I'll use a state machine.
        pass

    # I'll just look for the function start and replace the whole block if I can match the end.
    # Or simpler: Just find the specific lines I added and replace them?
    # No, I need to reorder them.
    
    # Let's try a different approach:
    # Find `function deleteEvent(index) {`
    # Then replace the next ~10 lines until `showToast("Event Deleted");` + `}`
    
    if 'function deleteEvent(index) {' in line and not delete_event_fixed:
        new_lines.append('        function deleteEvent(index) {\n')
        new_lines.append('            if (confirm("Delete this event?")) {\n')
        new_lines.append('                const eventId = appData.events[index].id;\n')
        new_lines.append('                if (window.Android && window.Android.cancelEvent) {\n')
        new_lines.append('                    window.Android.cancelEvent(eventId);\n')
        new_lines.append('                }\n')
        new_lines.append('                appData.events.splice(index, 1);\n')
        new_lines.append('                saveData();\n')
        new_lines.append('                renderEvents();\n')
        new_lines.append('                showToast("Event Deleted");\n')
        new_lines.append('            }\n')
        new_lines.append('        }\n')
        delete_event_fixed = True
        skip_until_brace = True
        print("Fixed deleteEvent logic")
        continue

    if skip_until_brace:
        # We need to skip the old body.
        # The old body ends with `}` of the function.
        # It has `if (confirm...` { ... } }`
        # It's safer to just skip specific lines I know are there.
        # The old body:
        # if (confirm("Delete this event?")) {
        #    appData.events.splice(index, 1);
        #    saveData();
        #    renderEvents();
        #    if (window.Android && window.Android.cancelEvent) {
        #        window.Android.cancelEvent(appData.events[index].id);
        #    }
        #    showToast("Event Deleted");
        # }
        # }
        
        # I will skip until I see `showToast("Event Deleted");` and then one more `}` line.
        if 'showToast("Event Deleted");' in line:
             # This is the last line of the if block
             pass
        elif line.strip() == '}' and 'function' not in line:
             # This could be the end of if or function.
             # Let's count braces? No, too complex for this simple script.
             
             # Alternative: Read the whole file into a string and use regex or string replace.
             pass
        
        # Let's use string replacement on the whole file content.
        pass

# Reset and use string replacement
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """        function deleteEvent(index) {
            if (confirm("Delete this event?")) {
                appData.events.splice(index, 1);
                saveData();
                renderEvents();
                if (window.Android && window.Android.cancelEvent) {
                    window.Android.cancelEvent(appData.events[index].id);
                }
                showToast("Event Deleted");
            }
        }"""

# The indentation might vary. Let's try to construct the exact string from previous view.
# From Step 242:
# 1610:         function deleteEvent(index) {
# 1611:             if (confirm("Delete this event?")) {
# 1612:                 appData.events.splice(index, 1);
# 1613:                 saveData();
# 1614:                 renderEvents();
# 1615:                 if (window.Android && window.Android.cancelEvent) {
# 1616:                     window.Android.cancelEvent(appData.events[index].id);
# 1617:                 }
# 1618:                 showToast("Event Deleted");
# 1619:             }
# 1620:         }

old_block_exact = """        function deleteEvent(index) {
            if (confirm("Delete this event?")) {
                appData.events.splice(index, 1);
                saveData();
                renderEvents();
                if (window.Android && window.Android.cancelEvent) {
                    window.Android.cancelEvent(appData.events[index].id);
                }
                showToast("Event Deleted");
            }
        }"""

new_block = """        function deleteEvent(index) {
            if (confirm("Delete this event?")) {
                const eventId = appData.events[index].id;
                if (window.Android && window.Android.cancelEvent) {
                    window.Android.cancelEvent(eventId);
                }
                appData.events.splice(index, 1);
                saveData();
                renderEvents();
                showToast("Event Deleted");
            }
        }"""

if old_block_exact in content:
    content = content.replace(old_block_exact, new_block)
    print("Replaced block successfully")
else:
    print("Could not find exact block match. Checking variations...")
    # Fallback: Try to match without indentation if possible, or just fail and I'll do it manually/differently.
    # Actually, the indentation in my string above uses 8 spaces.
    # The view showed:
    # 1610:         function deleteEvent(index) {
    # It looks like 8 spaces.
    pass

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
