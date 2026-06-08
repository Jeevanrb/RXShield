const { loadImage, createCanvas } = require('canvas');

async function testHeuristic() {
    // We need to find the latest image. 
    // Let's just use the known path or a pattern.
    // The user's image is likely the most recent one in the brain dir.
    const fs = require('fs');
    const dir = 'C:\\Users\\jeeva\\.gemini\\antigravity\\brain\\b3f2a9a1-66c0-4d1d-b186-e6475ae3d8e4\\';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort((a,b) => {
        return fs.statSync(dir + b).mtime.getTime() - fs.statSync(dir + a).mtime.getTime();
    });
    
    if (files.length === 0) return console.log('No image found');
    const imageUrl = dir + files[0];
    console.log('Testing image:', imageUrl);

    const img = await loadImage(imageUrl);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    const scale = Math.min(1, 200 / img.width);
    canvas.width = Math.floor(img.width * scale);
    canvas.height = Math.floor(img.height * scale);
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const totalPixels = canvas.width * canvas.height;
    
    let maxBright = 0;
    let minBright = 255;
    
    for (let i = 0; i < data.length; i += 4) {
        const bright = (data[i] + data[i+1] + data[i+2]) / 3;
        if (bright > maxBright) maxBright = bright;
        if (bright < minBright) minBright = bright;
    }
    
    const range = maxBright - minBright;
    const midPoint = minBright + (range / 2);
    
    let midToneCount = 0;
    let edgePixels = 0;
    
    for (let y = 0; y < canvas.height - 1; y++) {
      for (let x = 0; x < canvas.width - 1; x++) {
        const i = (y * canvas.width + x) * 4;
        const bright = (data[i] + data[i+1] + data[i+2]) / 3;
        
        if (Math.abs(bright - midPoint) < range * 0.3) {
            midToneCount++;
        }
        
        const iRight = i + 4;
        const iDown = i + canvas.width * 4;
        const bRight = (data[iRight] + data[iRight+1] + data[iRight+2]) / 3;
        const bDown = (data[iDown] + data[iDown+1] + data[iDown+2]) / 3;
        
        if (Math.abs(bright - bRight) > 20 || Math.abs(bright - bDown) > 20) {
            edgePixels++;
        }
      }
    }
    
    const midToneRatio = midToneCount / totalPixels;
    const edgeRatio = edgePixels / totalPixels;
    
    console.log(`midToneRatio: ${midToneRatio.toFixed(3)}`);
    console.log(`edgeRatio: ${edgeRatio.toFixed(3)}`);
}

testHeuristic().catch(console.error);
