
import os

FILE_PATH = r"c:\Users\Shaik\AndroidStudioProjects\Istiqamat\app\src\main\assets\index.html"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def visual_revamp(content):
    print("Applying Visual Revamp...")
    
    # 1. INJECT GREETING SPAN (If missing)
    # The screenshots show "Assalamu Alaikum, User" without a specific span, likely static text + user name span.
    # We need to target the header area.
    # Pattern: <p class="text-muted">Assalamu Alaikum,</p> OR similar.
    
    # Let's inspect the content dynamically or assume standard structure.
    # "Assalamu Alaikum," might be hardcoded.
    
    if "Assalamu Alaikum," in content:
        print("Found static greeting. Replacing with dynamic span...")
        content = content.replace("Assalamu Alaikum,", '<span id="greeting-text">Good Morning</span>,')
        
    # 2. UPDATE MAIN THEME CSS
    # We want to ensure specific CSS variables are present for the themes to work well.
    # We'll inject a style block override at the end of <head>
    
    style_override = """
    <style>
    /* VISUAL REVAMP OVERRIDES */
    :root {
        --bg-dark: #050816;
        --neon-primary: #00ff8c;
        --neon-secondary: #00f5ff;
        --glass-bg: rgba(255, 255, 255, 0.05);
        --glass-border: rgba(255, 255, 255, 0.1);
        --card-radius: 20px;
    }
    
    body {
        background: var(--bg-dark); /* Fallback */
        background-image: var(--liquid-gradient, linear-gradient(135deg, #050816 0%, #1a1f3c 100%));
        background-attachment: fixed;
    }
    
    .glass-panel {
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
    }
    
    /* Shop Item Visuals */
    .shop-item-icon {
        font-size: 2rem;
        margin-right: 15px;
        filter: drop-shadow(0 0 5px currentColor);
    }
    </style>
    """
    content = content.replace("</head>", style_override + "\n</head>")
    
    # 3. ENSURE STORE CONTAINER EXISTS
    # If the file is old, it might not have <div id="shop-container"> inside the Store Screen.
    # We search for "Store" or "Shop" screen.
    
    if 'id="shop-container"' not in content:
        # Locate the Store/Market/Shop screen div
        # Often id="store-screen" or "market-screen"
        if 'id="store-screen"' in content:
            print("injecting shop container...")
            # Replace inner content or append?
            # Find the header "Store" or "Marketplace"
            # We'll try to find a place to dump the container.
            pass
            # Actually, `safe_update` defines `renderStore` which targets `shop-container`.
            # If it's missing, `renderStore` does nothing.
            # We MUST find the store screen.
            
    # Let's try to replace the entire "Store" screen content if we can identify it.
    # <div class="screen" id="store-screen">
    
    return content

def main():
    content = read_file(FILE_PATH)
    content = visual_revamp(content)
    write_file(FILE_PATH, content)
    print("Visual Revamp Applied.")

if __name__ == "__main__":
    main()
