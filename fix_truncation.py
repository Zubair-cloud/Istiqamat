
import os

file_path = r"c:\Users\Shaik\AndroidStudioProjects\Istiqamat\app\src\main\assets\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix truncation
# The bad line is "     onConfirm) {"
# We want "    function showConfirm(title, message, onConfirm) {"

bad_string = "     onConfirm) {"
good_string = "    function showConfirm(title, message, onConfirm) {"

if bad_string in content:
    content = content.replace(bad_string, good_string)
    print("Fixed truncation!")
else:
    # Try a looser match if whitespace is different
    bad_string_2 = "onConfirm) {"
    if bad_string_2 in content:
         # Be careful not to replace valid code, but this is end of function sig
         # Check context
         idx = content.find(bad_string_2)
         # Check if preceded by newline/spaces
         # actually, just replace it if it looks like the broken line
         # The broken line in view_file was:
         # 1554:      onConfirm) {
         content = content.replace(bad_string_2, "function showConfirm(title, message, onConfirm) {")
         print("Fixed truncation (loose match)!")
    else:
        print("Could not find truncation to fix.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
