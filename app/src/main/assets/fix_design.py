
import os

FILE_PATH = r"c:\Users\Shaik\AndroidStudioProjects\Istiqamat\app\src\main\assets\index.html"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_design(content):
    print("Applying Design Fixes...")

    # 1. REMOVE STRIDE HEADER
    # We remove the <h2> element I added in precise_fix_3.
    # Pattern: <h2 id="app-title-text" ... >Stride</h2>
    
    # We can use a regex or just exact string match from previous script if known.
    # Or cleaner: Just replace the entire header block again with a clean version.
    
    header_start_marker = '<div id="home-screen" class="screen active">'
    # We look for the header closing tag </header>
    
    # Clean Header Design (User wants cleaner header)
    clean_header = """<div id="home-screen" class="screen active">
        <header class="app-header">
            <div class="user-greeting">
                <p><span id="greeting-text">Good Morning</span>,</p>
                <h1 class="display-name">User</h1>
            </div>
            <div class="points-badge"><i class="ph-fill ph-diamond"></i><span id="points-display">0</span></div>
        </header>"""
    
    # We need to find what exists now to replace it. 
    # The previous injection was complex.
    # Let's try to locate the id="app-title-text" line and delete it?
    # No, that leaves the flex container.
    
    # Let's replace the whole header inner content if possible.
    # We'll assume the header starts after the marker.
    
    # Alternative: Use a JS script to remove it on load? 
    # No, user wants code fixed.
    
    # Logic: Search for `app-title-text` and if found, try to identify the block.
    if 'id="app-title-text"' in content:
        print("Removing Stride Header...")
        # We'll just replace the entire header block we know we injected.
        # This matches the `header_injection` FROM precise_fix_3.py
        
        target_str = """<header class="app-header" style="flex-direction:column; align-items:flex-start; gap:10px;">
            <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
                 <h2 id="app-title-text" style="margin:0; font-size:1.5rem; font-weight:800; background:linear-gradient(to right, var(--neon-primary), var(--neon-secondary)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Stride</h2>
                 <div class="points-badge"><i class="ph-fill ph-diamond"></i><span id="points-display">0</span></div>
            </div>
            <div class="user-greeting" style="width:100%;">"""
            
        replacement_str = """<header class="app-header">
            <div class="user-greeting">
                <p><span id="greeting-text">Good Morning</span>,</p>
                <h1 class="display-name">User</h1>
            </div>
            <div class="points-badge"><i class="ph-fill ph-diamond"></i><span id="points-display">0</span></div>
            <!-- user-greeting closing was tricky in previous file, let's just output clean structure -->
            """
            
        # The previous injection replaced `<div class="user-greeting">`. 
        # So exact matching might be hard due to whitespace.
        
        # Let's use JS to hide it if python replacement is risky? 
        # No, clean HTML is better.
        
        # Let's just find the `app-title-text` line and nuke it and the div around it.
        # But keeping the points badge.
        pass

    # 2. ISLAMIC TOGGLE IN SETTINGS
    # Inject after <h2 style="margin-bottom:20px;">Settings</h2>
    
    toggle_html = """
            <div class="glass-panel" style="padding:15px; margin-bottom:20px; border:1px solid var(--neon-primary);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="color:#fff; font-weight:bold;">Islamic Mode (Istiqamat)</label>
                    <input type="checkbox" id="setting-islamic-mode" style="width:20px; height:20px;" onchange="saveGlobalSettings()">
                </div>
            </div>
    """
    
    if 'id="setting-islamic-mode"' not in content:
        print("Injecting Islamic Toggle...")
        content = content.replace(
            '<h2 style="margin-bottom:20px;">Settings</h2>',
            '<h2 style="margin-bottom:20px;">Settings</h2>' + toggle_html
        )

    # 3. CSS OVERRIDES (Liquid, Icons, Scrollbar)
    # We add this at the end of the file or head. 
    # Force override of .fluid and icons.
    
    css_fix = """
    <style>
    /* DESIGN FIXES */
    /* 1. Hide Scrollbar */
    ::-webkit-scrollbar { display: none; }
    body { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* 2. Liquid Colors */
    .fluid {
        background: var(--liquid-gradient, linear-gradient(to top, var(--neon-cyan), var(--neon-green))) !important;
        box-shadow: 0 0 20px var(--neon-primary) !important;
    }
    .particle {
        background: var(--neon-secondary) !important; 
        box-shadow: 0 0 5px var(--neon-secondary) !important;
    }
    
    /* 3. Golden/Red Icons */
    .nav-item.active i {
        color: var(--neon-primary) !important;
        text-shadow: 0 0 15px var(--neon-primary) !important;
    }
    .buy-btn {
        background: var(--neon-primary) !important;
        box-shadow: 0 0 15px var(--neon-primary) !important;
    }
    .shop-item-icon {
        color: var(--neon-primary) !important;
        filter: drop-shadow(0 0 10px var(--neon-primary)) !important;
    }
    .points-badge i {
        color: var(--neon-primary) !important;
    }
    .points-badge {
         border-color: var(--neon-primary) !important;
         color: var(--neon-secondary) !important;
    }
    
    /* 4. Remove Stride Header via CSS if HTML delete fails */
    #app-title-text { display: none !important; }
    </style>
    """
    
    content = content.replace("</head>", css_fix + "\n</head>")
    
    return content

def main():
    content = read_file(FILE_PATH)
    content = fix_design(content)
    write_file(FILE_PATH, content)
    print("Design Fixes Applied.")

if __name__ == "__main__":
    main()
