import os

# Files to patch
html_files = ['index.html', 'menu.html', 'orders.html', 'cart.html']

favorites_link = '<a href="favorites.html" class="nav-link">Favorites (<span id="fav-count">0</span>)</a>'
social_icons = """  <div class="social-icons">
    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa-brands fa-facebook"></i></a>
    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i class="fa-brands fa-twitter"></i></a>
    <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
  </div>"""

for html_file in html_files:
    if not os.path.exists(html_file): continue
    
    with open(html_file, 'r') as f:
        content = f.read()
    
    # 1. Insert Favorites link
    # Find '<a href="index.html#about" class="nav-link">About</a>'
    if 'href="index.html#about"' in content and 'href="favorites.html"' not in content:
        # We need to insert it right after the about link.
        content = content.replace(
            '<a href="index.html#about" class="nav-link">About</a>',
            f'<a href="index.html#about" class="nav-link">About</a>\n      {favorites_link}'
        )
        
    # 2. Insert Social Icons
    if '<div class="social-icons">' not in content:
        content = content.replace(
            '<footer>\n  <p>',
            f'<footer>\n{social_icons}\n  <p>'
        )
        
    with open(html_file, 'w') as f:
        f.write(content)
        
# 3. Patch js/main.js
js_file = 'js/main.js'
if os.path.exists(js_file):
    with open(js_file, 'r') as f:
        js_content = f.read()
        
    if 'updateCartCount();' in js_content and 'updateFavCount();' not in js_content:
        js_content = js_content.replace(
            'updateCartCount();',
            'updateCartCount();\n  updateFavCount();'
        )
        with open(js_file, 'w') as f:
            f.write(js_content)

print("Patching complete!")
