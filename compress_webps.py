import os
from PIL import Image

base_dir = r"c:\Users\Arenapc\Desktop\PROJETOS\giardini\assets\images"
images_to_compress = [
    'sala-privativa-grande.webp',
    'sala-privativa-media.webp',
    'sala-privativa-pequena.webp',
    'salao-principal.webp',
    'lounge-reservado.webp',
    'jardim-externo.webp'
]

MAX_WIDTH = 1200

for img_name in images_to_compress:
    img_path = os.path.join(base_dir, img_name)
    if os.path.exists(img_path):
        try:
            img = Image.open(img_path)
            # Calculate new size while keeping aspect ratio
            width, height = img.size
            if width > MAX_WIDTH:
                ratio = MAX_WIDTH / width
                new_size = (MAX_WIDTH, int(height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save the image, overwriting the original, with lower quality
            img.save(img_path, format="WEBP", quality=70, optimize=True)
            new_size_kb = os.path.getsize(img_path) / 1024
            print(f"Compressed {img_name}: {new_size_kb:.2f} KB")
            img.close()
        except Exception as e:
            print(f"Failed to compress {img_name}: {e}")
    else:
        print(f"File {img_name} not found.")
