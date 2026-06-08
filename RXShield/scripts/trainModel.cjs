const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const knnClassifier = require('@tensorflow-models/knn-classifier');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure TFJS uses CPU backend (since we are not using tfjs-node to avoid build errors)
require('@tensorflow/tfjs-backend-cpu');

async function imageToTensor(imagePath) {
    const img = await loadImage(imagePath);
    // Resize down heavily to prevent huge tensors and speed up training (MobileNet is fine with 224x224)
    const size = 224;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const rgbData = new Float32Array(canvas.width * canvas.height * 3);
    for (let i = 0; i < canvas.width * canvas.height; i++) {
        rgbData[i * 3] = data[i * 4];         // R
        rgbData[i * 3 + 1] = data[i * 4 + 1]; // G
        rgbData[i * 3 + 2] = data[i * 4 + 2]; // B
    }
    
    // MobileNet expects tensor of shape [height, width, 3] or [1, height, width, 3]
    const tensor = tf.tensor3d(rgbData, [canvas.height, canvas.width, 3], 'float32');
    return tensor;
}

async function train() {
    console.log('Loading TFJS Models...');
    const classifier = knnClassifier.create();
    
    let net;
    for (let i = 0; i < 3; i++) {
        try {
            net = await mobilenet.load({ version: 2, alpha: 1.0 });
            break;
        } catch (e) {
            console.log(`Failed to load mobilenet (attempt ${i+1}): ${e.message}`);
            if (i === 2) throw e;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    console.log('Models loaded.');
    
    const trainingDir = path.join(__dirname, '../training_data');
    if (!fs.existsSync(trainingDir)) {
        console.log('No training_data folder found. Creating one...');
        fs.mkdirSync(trainingDir, { recursive: true });
        console.log('Please put your images in the training_data folder and run this script again.');
        return;
    }
    
    const files = fs.readdirSync(trainingDir);
    const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
    
    if (imageFiles.length === 0) {
        console.log('No images found in training_data folder.');
        return;
    }
    
    console.log(`Found ${imageFiles.length} training images.`);
    
    for (const file of imageFiles) {
        // Label is filename before underscore or dot, e.g., "Normal_1.jpg" -> "Normal"
        let label = file.split('_')[0].split('.')[0].trim();
        // Replace dashes with spaces for clean labels
        label = label.replace(/-/g, ' ');
        
        console.log(`Processing ${file} as label: "${label}"...`);
        try {
            const tensor = await imageToTensor(path.join(trainingDir, file));
            const features = net.infer(tensor, true);
            
            classifier.addExample(features, label);
            
            tensor.dispose();
            features.dispose();
        } catch (err) {
            console.error(`Failed to process ${file}:`, err.message);
        }
    }
    
    console.log('Training complete! Serializing model state...');
    const dataset = classifier.getClassifierDataset();
    const datasetObj = {};
    
    Object.keys(dataset).forEach((key) => {
        let data = dataset[key].dataSync();
        datasetObj[key] = Array.from(data);
        datasetObj[key + '_shape'] = dataset[key].shape;
    });
    
    const jsonStr = JSON.stringify(datasetObj);
    const outPath = path.join(__dirname, '../src/assets/initial_model.json');
    const publicPath = path.join(__dirname, '../public/initial_model.json');
    
    // Ensure assets dir exists
    const assetsDir = path.dirname(outPath);
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    
    // Ensure public dir exists
    const publicDir = path.dirname(publicPath);
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    
    fs.writeFileSync(outPath, jsonStr);
    fs.writeFileSync(publicPath, jsonStr);
    console.log(`Model successfully saved to ${outPath}`);
    console.log(`Model also copied to ${publicPath} (served by Vite)`);
    console.log(`The React app will now load this knowledge automatically on startup!`);
}

train().catch(console.error);
