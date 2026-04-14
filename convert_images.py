import os
try:
    from PIL import Image
    has_pil = True
except ImportError:
    has_pil = False

base_dir = r"c:\Users\Arenapc\Desktop\PROJETOS\giardini\assets\images"

# environments mapping
envs = {
  'space.webp': 'jardim-externo.webp',
  '_MG_2011.jpg': 'salao-principal.webp',
  '_MG_2064.jpg': 'lounge-reservado.webp',
  '_MG_1994.jpg': 'sala-privativa-pequena.webp',
  '_MG_2008.jpg': 'sala-privativa-media.webp',
  '_MG_2005 (1).jpg': 'sala-privativa-grande.webp'
}

if not has_pil:
    print("PIL is missing. Please install Pillow.")
else:
    for old, new in envs.items():
        old_path = os.path.join(base_dir, old)
        new_path = os.path.join(base_dir, new)
        if os.path.exists(old_path):
            if old.endswith('.webp'):
                os.rename(old_path, new_path)
                print(f"Renamed {old} to {new}")
            else:
                img = Image.open(old_path)
                img.save(new_path, format="WEBP", quality=85)
                print(f"Converted {old} to {new}")
                img.close()
                os.remove(old_path)
        else:
            print(f"File {old} not found.")
