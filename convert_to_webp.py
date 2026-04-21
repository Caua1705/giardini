from PIL import Image
import os

# CAMINHO DA IMAGEM
input_path = "assets/images/foto.jpg"

# QUALIDADE (0-100)
quality = 80

# Nome do arquivo de saída
file_name = os.path.splitext(input_path)[0]
output_path = file_name + ".webp"

# Abre a imagem
img = Image.open(input_path)

# Redimensiona se for maior que 1200px de largura
if img.width > 1200:
    ratio = 1200 / img.width
    new_height = int(img.height * ratio)
    img = img.resize((1200, new_height), Image.Resampling.LANCZOS)

# Salva como WebP
img.save(output_path, "webp", quality=quality)

print(f"Convertido: {output_path}")