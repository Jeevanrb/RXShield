import os
import glob
from PIL import Image

artifact_dir = 'C:/Users/jeeva/.gemini/antigravity/brain/61a24e79-4bb2-4170-8aaa-580febc177d2'
images = glob.glob(os.path.join(artifact_dir, 'media__*'))

print(f'Found {len(images)} media files:')
for img_path in sorted(images):
    name = os.path.basename(img_path)
    size_kb = os.path.getsize(img_path) / 1024
    try:
      with Image.open(img_path) as img:
          w, h = img.size
          aspect = w / h
          print(f'- {name}: {w}x{h} (Aspect Ratio: {aspect:.2f}, Size: {size_kb:.1f} KB)')
    except Exception as e:
      print(f'- {name}: Error opening ({e}), Size: {size_kb:.1f} KB')
