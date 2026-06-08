import { loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

const artifactDir = 'C:/Users/jeeva/.gemini/antigravity/brain/61a24e79-4bb2-4170-8aaa-580febc177d2';

async function checkImages() {
  const files = fs.readdirSync(artifactDir);
  const mediaFiles = files.filter(f => f.startsWith('media__') && (f.endsWith('.png') || f.endsWith('.jpg')));

  console.log(`Found ${mediaFiles.length} media files:`);
  for (const file of mediaFiles.sort()) {
    const fullPath = path.join(artifactDir, file);
    const sizeKB = fs.statSync(fullPath).size / 1024;
    try {
      const img = await loadImage(fullPath);
      const aspect = img.width / img.height;
      console.log(`- ${file}: ${img.width}x${img.height} (Aspect: ${aspect.toFixed(2)}, Size: ${sizeKB.toFixed(1)} KB)`);
    } catch (err) {
      console.log(`- ${file}: Error loading (${err.message}), Size: ${sizeKB.toFixed(1)} KB`);
    }
  }
}

checkImages().catch(console.error);
