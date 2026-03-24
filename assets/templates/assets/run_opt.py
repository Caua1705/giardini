import re
import os

filepath = 'c:/Users/Arenapc/Desktop/PROJETOS/artools_novo/assets/templates/assets/hero_premium.html'

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

original_length = len(html)

# Extract all <style> tags
style_tags = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL | re.IGNORECASE)
html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)

# Process the merged styles
merged_styles = "\n".join(style_tags)

# Optimization 1: Remove excessive blur filters in CSS
# (filter: blur(40px) to filter: blur(130px) mostly applied to glows/orbs)
merged_styles = re.sub(r'filter:\s*blur\([4-9]\dpx\);?', '', merged_styles, flags=re.IGNORECASE)
merged_styles = re.sub(r'filter:\s*blur\(\d{3}px\);?', '', merged_styles, flags=re.IGNORECASE)

# Also remove them from inline HTML styles
html = re.sub(r'filter:\s*blur\([4-9]\dpx\);?', '', html, flags=re.IGNORECASE)
html = re.sub(r'filter:\s*blur\(\d{3}px\);?', '', html, flags=re.IGNORECASE)

# Optimization 2: Remove redundant noise overlays that cause multiple paint layers
# The design uses #global-grain, so we remove .noise-overlay and #hero-grain
html = re.sub(r'<div class="noise-overlay".*?</div>', '', html, flags=re.DOTALL | re.IGNORECASE)
html = re.sub(r'<div id="hero-grain".*?</div>', '', html, flags=re.DOTALL | re.IGNORECASE)

# Optimization 3: Clean up will-change to avoid keeping rendering surfaces in GPU memory constantly
# will-change: transform, filter -> will-change: transform
merged_styles = merged_styles.replace('will-change: transform, filter', 'will-change: transform')
merged_styles = merged_styles.replace('will-change: transform,filter', 'will-change: transform')
merged_styles = merged_styles.replace('will-change: transform, opacity, filter', 'will-change: transform, opacity')

# Optional string compression (minification) for CSS
# Remove extra empty lines and spaces in CSS
lines = [l.strip() for l in merged_styles.split('\n')]
clean_style = ""
for line in lines:
    if line:
        clean_style += line + " "

# Re-insert the merged, optimized <style> back into the head
style_block = f"\n<style>\n{clean_style}\n</style>\n"
html = html.replace('</head>', style_block + '</head>')

# Ensure no blank empty lines in JS/HTML
# Simple multi-line cleanup to reduce file size further
html = re.sub(r'\n\s*\n', '\n', html)

optimized_length = len(html)

print(f"Original length: {original_length}")
print(f"Optimized length: {optimized_length}")
print(f"Bytes saved: {original_length - optimized_length}")

# Backup the original file
os.rename(filepath, filepath.replace('.html', '_backup.html'))

# Write the new file
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)

print("Optimization completed successfully.")
