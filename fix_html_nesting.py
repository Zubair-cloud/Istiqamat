import os

file_path = 'app/src/main/assets/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to insert a </div> before <!-- MANAGE SCREEN -->
# But only if it's missing.
# Let's check the context.
# 903:             </div>
# 904: 
# 905:     <!-- MANAGE SCREEN -->

# We want to turn:
#             </div>
# 
#     <!-- MANAGE SCREEN -->

# Into:
#             </div>
#         </div>
#     </div>
# 
#     <!-- MANAGE SCREEN -->

# Wait, let's look at the indentation.
# 866: <div id="shop-screen" class="screen">
# 871:     <div class="content-area">
# ...
# 903:             </div> (closes glass-panel)
# 
# We need to close content-area AND shop-screen.
# So we need TWO </div> tags if only one is present.

# Let's look at the file content around that area.
target = '            </div>\n\n    <!-- MANAGE SCREEN -->'
replacement = '            </div>\n        </div>\n    </div>\n\n    <!-- MANAGE SCREEN -->'

# It might be:
#             </div>
#     <!-- MANAGE SCREEN -->
# (without extra newline)

# Let's try to find the specific block.
search_block = """            <div class="glass-panel" style="padding:15px; min-height:100px;">
                <div id="history-list">
                    <p style="text-align:center; color:#666; font-size:0.8rem;">No transactions yet.</p>
                </div>
            </div>"""

idx = content.find(search_block)
if idx == -1:
    print("Could not find history-list block")
    exit()

# Find the next MANAGE SCREEN comment
manage_idx = content.find('<!-- MANAGE SCREEN -->', idx)
if manage_idx == -1:
    print("Could not find MANAGE SCREEN")
    exit()

# The text between them should be just closing divs.
between = content[idx + len(search_block):manage_idx]
print(f"Text between: {repr(between)}")

# It should contain two </div> tags to close content-area and shop-screen.
# If it only has newlines or one div, we fix it.

# We expect:
# \n\n        </div>\n    </div>\n\n    

if between.count('</div>') < 2:
    print("Missing closing divs detected.")
    # We will replace the whole chunk to be safe.
    # We want to close everything properly.
    
    # Construct the correct closing sequence.
    # The search_block ends with </div> (closing glass-panel).
    # We need to close content-area and shop-screen.
    
    new_between = "\n\n        </div>\n    </div>\n\n    "
    
    new_content = content[:idx + len(search_block)] + new_between + content[manage_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed HTML nesting.")
else:
    print("HTML nesting seems correct (found enough closing divs).")
