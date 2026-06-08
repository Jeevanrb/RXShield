const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function processImage() {
    const imgPath = 'C:\\Users\\jeeva\\.gemini\\antigravity\\brain\\b3f2a9a1-66c0-4d1d-b186-e6475ae3d8e4\\media__1779010023663.png';
    console.log('Loading image:', imgPath);
    const img = await loadImage(imgPath);
    
    // There are 5 strips. We can divide the height by 5.
    const stripHeight = img.height / 5;
    const width = img.width;
    
    const labels = [
        "Second-degree block",
        "Atrial fibrillation",
        "Ventricular tachycardia",
        "Ventricular fibrillation",
        "Third-degree block"
    ];
    
    const outDir = path.join(__dirname, '../training_data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    
    for (let i = 0; i < 5; i++) {
        const canvas = createCanvas(width, stripHeight);
        const ctx = canvas.getContext('2d');
        
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        ctx.drawImage(img, 0, i * stripHeight, width, stripHeight, 0, 0, width, stripHeight);
        
        const buffer = canvas.toBuffer('image/png');
        const filename = labels[i].replace(/\s+/g, '-') + '.png';
        fs.writeFileSync(path.join(outDir, filename), buffer);
        console.log('Saved', filename);
    }
}

processImage().catch(console.error);
