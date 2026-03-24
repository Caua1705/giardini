import re
import os

filepath = 'c:/Users/Arenapc/Desktop/PROJETOS/artools_novo/assets/templates/assets/hero_premium.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

styles = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL | re.IGNORECASE)

print(f"File size: {len(content)} bytes")
print(f"Total lines: {content.count(chr(10))}")
print(f"Number of style tags: {len(styles)}")
print(f"Number of script tags: {len(scripts)}")

total_css = sum(len(s) for s in styles)
total_js = sum(len(s) for s in scripts)

print(f"Total CSS size: {total_css} chars")
print(f"Total JS size: {total_js} chars")

# Check heavy CSS
blurs = re.findall(r'filter:\s*blur', content, re.IGNORECASE)
glows = re.findall(r'box-shadow:.*rgba', content, re.IGNORECASE)
will_change = re.findall(r'will-change', content, re.IGNORECASE)

print(f"Blur filters count: {len(blurs)}")
print(f"Box shadows with rgb/a: {len(glows)}")
print(f"will-change properties: {len(will_change)}")

# Unused/redundant wrappers
wrappers = re.findall(r'<div[^>]*aria-hidden="true"[^>]*>', content, re.IGNORECASE)
print(f"Aria-hidden elements (overlays/decorations): {len(wrappers)}")

