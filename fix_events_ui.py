import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract and remove manage-events-section from wrong location
# It was around line 906 in previous views
start_marker = '            <!-- EVENTS SECTION -->'
end_marker = '                <div id="events-list"></div>\n            </div>'

# We need to be careful with extraction. Let's find the block.
# The block looks like:
#             <!-- EVENTS SECTION -->
#             <div id="manage-events-section" style="display:none;">
#                 ...
#                 <div id="events-list"></div>
#             </div>

start_idx = content.find('            <!-- EVENTS SECTION -->')
if start_idx == -1:
    print("Could not find EVENTS SECTION start")
    exit()

# Find the end of the div. It closes with </div> at indentation level 12 spaces?
# Let's look for the next comment or known marker.
# The next section is <!-- MANAGE SCREEN --> at line 935 (in original view)
end_idx = content.find('    <!-- MANAGE SCREEN -->')

if end_idx == -1:
    print("Could not find MANAGE SCREEN start")
    exit()

# The events section is before MANAGE SCREEN.
events_block = content[start_idx:end_idx]

# Remove it from there
new_content = content[:start_idx] + content[end_idx:]

# 2. Insert it into the correct place: inside manage-screen, after manage-journal-section
# manage-journal-section ends around line 969 (in original view)
# Look for:
#             <div id="manage-journal-section" style="display:none;">
#                 ...
#             </div>
#
#         </div>
#     </div>
#
#     <!-- PROFILE -->

# Let's find where manage-journal-section ends.
journal_start = new_content.find('<div id="manage-journal-section"')
if journal_start == -1:
    print("Could not find manage-journal-section")
    exit()

# Find the closing div of manage-journal-section.
# It's hard to find exact closing div without parsing.
# But we know it is followed by `        </div>\n    </div>\n\n    <!-- PROFILE -->`
# Actually, `        </div>` (content-area) then `    </div>` (manage-screen).
# So we can insert before `        </div>\n    </div>\n\n    <!-- PROFILE -->`

insert_point = new_content.find('    <!-- PROFILE -->')
# We want to insert inside the content-area div.
# The structure is:
# <div class="content-area">
#    ...
#    <div id="manage-journal-section">...</div>
# </div>
# </div> (manage-screen)

# So we should look for the closing of content-area.
# It is the `</div>` before `    </div>` before `    <!-- PROFILE -->`.
# Let's search backwards from PROFILE.

profile_idx = new_content.find('    <!-- PROFILE -->')
# Go back to find the closing divs.
# We can just insert it immediately after manage-journal-section?
# Let's try to find `            <div id="manage-journal-section" style="display:none;">`
# Then find the next `            </div>` that closes it? No, nested divs.

# Safer bet: Insert before `        </div>\n    </div>\n\n    <!-- PROFILE -->`
# Wait, indentation is key.
# 12 spaces for section.
# 8 spaces for content-area closing?
# Let's look at the file content again.
# 971:         </div>
# 972:     </div>
# 974:     <!-- PROFILE -->

# So we want to insert before line 971.
target_str = '        </div>\n    </div>\n\n    <!-- PROFILE -->'
replace_str = events_block + '\n' + target_str

if target_str in new_content:
    new_content = new_content.replace(target_str, replace_str)
    print("Moved Events Section")
else:
    print("Could not find insertion point for Events Section")
    # Try looser match
    target_str_2 = '        </div>\n    </div>\n\n    <!-- PROFILE'
    if target_str_2 in new_content:
         new_content = new_content.replace(target_str_2, events_block + '\n' + target_str_2)
         print("Moved Events Section (Loose match)")
    else:
         print("Failed to move section")
         exit()

# 3. Add Tab Button
# Look for:
#                 <div class="manage-tab" onclick="switchManageTab('journal')">Journal</div>
# Insert after it.

tab_marker = '<div class="manage-tab" onclick="switchManageTab(\'journal\')">Journal</div>'
tab_insert = '\n                <div class="manage-tab" onclick="switchManageTab(\'events\')">Events</div>'

if tab_marker in new_content:
    new_content = new_content.replace(tab_marker, tab_marker + tab_insert)
    print("Added Events Tab Button")
else:
    print("Could not find Journal Tab button")

# 4. Update switchManageTab function
# We need to make sure it hides/shows the new section.
# I'll just replace the function with a known good version.
# It's likely near the bottom.

switch_func_start = 'function switchManageTab(tab) {'
# I don't have the full function content in view, but I can append the logic if I find it.
# Or I can just rewrite it if I find the block.
# Let's assume the user might have it.
# Actually, I can just search for it.

# Let's try to find the function and see if it has 'events'.
if "case 'events':" not in new_content and 'if (tab === \'events\')' not in new_content:
    # It might be using a loop or simple ID logic.
    # Let's look for:
    # document.getElementById('manage-habits-section').style.display = tab === 'habits' ? 'block' : 'none';
    # document.getElementById('manage-journal-section').style.display = tab === 'journal' ? 'block' : 'none';
    
    match_str = "document.getElementById('manage-journal-section').style.display = tab === 'journal' ? 'block' : 'none';"
    if match_str in new_content:
        new_line = "            document.getElementById('manage-events-section').style.display = tab === 'events' ? 'block' : 'none';"
        new_content = new_content.replace(match_str, match_str + '\n' + new_line)
        print("Updated switchManageTab logic")
    else:
        print("Could not update switchManageTab logic (pattern not found)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
