import os
import re
from PIL import Image

raw_dir = r"c:\Users\Arenapc\Desktop\PROJETOS\artools_novo\assets\raw_files"
html_file = r"c:\Users\Arenapc\Desktop\PROJETOS\artools_novo\assets\templates\assets\hero_premium.html"

MAX_WIDTH = 1200
TARGET_SIZE_KB = 300

def optimize_image(filepath, save_path):
    img = Image.open(filepath)
    # Convert RGBA to RGB if needed (e.g. PNG with transparency or P mode)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    width, height = img.size
    if width > MAX_WIDTH:
        ratio = MAX_WIDTH / float(width)
        new_height = int((float(height) * float(ratio)))
        img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

    quality = 75
    img.save(save_path, "WEBP", quality=quality)
    
    # Compress loop if target not met
    while os.path.getsize(save_path) > (TARGET_SIZE_KB * 1024) and quality > 30:
        quality -= 5
        img.save(save_path, "WEBP", quality=quality)

    return quality, width, height

with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

replacements = 0
processed_files = []

for filename in os.listdir(raw_dir):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        old_path = os.path.join(raw_dir, filename)
        name, ext = os.path.splitext(filename)
        new_filename = name + ".webp"
        new_path = os.path.join(raw_dir, new_filename)
        
        print(f"Processing {filename}...")
        try:
            original_size = os.path.getsize(old_path) / 1024
            final_q, raw_w, raw_h = optimize_image(old_path, new_path)
            new_size_kb = os.path.getsize(new_path) / 1024
            print(f"  -> Done! {original_size:.1f}KB -> {new_size_kb:.1f}KB (Quality: {final_q}, Original W: {raw_w})")
            
            # Pattern to precisely match the filename in HTML to avoid partial overwrites
            # Example: teste1.jpg -> teste1.webp
            pattern = re.compile(re.escape(filename), re.IGNORECASE)
            html_content, count = pattern.subn(new_filename, html_content)
            replacements += count
            
            processed_files.append((filename, new_filename, original_size, new_size_kb))
            
            # Remove the original file to free space
            os.remove(old_path)
        except Exception as e:
            print(f"  -> Error: {e}")

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"\nOptimization Summary:")
print(f"----------------------")
total_old = sum(x[2] for x in processed_files)
total_new = sum(x[3] for x in processed_files)
print(f"Total size before: {total_old/1024:.2f} MB")
print(f"Total size after:  {total_new/1024:.2f} MB")
print(f"Space saved:       {(total_old - total_new)/1024:.2f} MB")
print(f"HTML modifications: {replacements} occurences replaced.")
