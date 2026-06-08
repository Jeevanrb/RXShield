import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

class AIService {
  constructor() {
    this.classifier = knnClassifier.create();
    this.mobilenetModule = null;
    this.initPromise = this.init();
  }

  async init() {
    console.log('Loading MobileNet & KNN Model...');
    this.mobilenetModule = await mobilenet.load({ version: 2, alpha: 1.0 });

    try {
      const response = await fetch('/initial_model.json');
      if (response.ok) {
        const datasetStr = await response.text();
        const datasetObj = JSON.parse(datasetStr);
        const tensorObj = Object.fromEntries(
          Object.entries(datasetObj)
            .filter(([key]) => !key.endsWith('_shape'))
            .map(([key, value]) => [
              key,
              tf.tensor2d(value, datasetObj[`${key}_shape`])
            ])
        );
        this.classifier.setClassifierDataset(tensorObj);
        console.log('Successfully loaded brain with', this.classifier.getNumClasses(), 'classes.');
      }
    } catch (e) {
      console.warn('Could not load initial_model.json, starting fresh.', e);
    }
  }

  extractFeatures(img) {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 224, 224);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const rgbData = new Float32Array(canvas.width * canvas.height * 3);
    for (let i = 0; i < canvas.width * canvas.height; i++) {
        rgbData[i * 3] = data[i * 4];         // R
        rgbData[i * 3 + 1] = data[i * 4 + 1]; // G
        rgbData[i * 3 + 2] = data[i * 4 + 2]; // B
    }
    
    return tf.tidy(() => {
      const imgTensor = tf.tensor3d(rgbData, [canvas.height, canvas.width, 3], 'float32');
      return this.mobilenetModule.infer(imgTensor, true);
    });
  }

  async predict(imgElement) {
    await this.initPromise;
    const dataset = this.classifier.getClassifierDataset();
    const classes = Object.keys(dataset).filter(key => !key.endsWith('_shape'));
    
    if (classes.length === 0) {
      return { label: 'needs_training', confidence: 0 };
    }

    const featuresTensor = this.extractFeatures(imgElement);
    const query = featuresTensor.dataSync();
    featuresTensor.dispose();

    // L2 Normalize the query vector
    let queryMag = 0;
    for (let i = 0; i < query.length; i++) {
      queryMag += query[i] * query[i];
    }
    queryMag = Math.sqrt(queryMag);
    if (queryMag === 0) queryMag = 1;
    const queryNorm = new Float32Array(query.length);
    for (let i = 0; i < query.length; i++) {
      queryNorm[i] = query[i] / queryMag;
    }

    let bestLabel = 'Normal';
    let bestSim = -1;

    classes.forEach(label => {
      const tensor = dataset[label];
      const shape = tensor.shape;
      const numExamples = shape[0];
      const flatData = tensor.dataSync();

      for (let e = 0; e < numExamples; e++) {
        let dot = 0;
        let sumE = 0;
        const offset = e * 1280;

        for (let i = 0; i < 1280; i++) {
          const val = flatData[offset + i];
          dot += queryNorm[i] * val;
          sumE += val * val;
        }

        const magE = Math.sqrt(sumE);
        const sim = magE === 0 ? 0 : dot / magE;

        if (sim > bestSim) {
          bestSim = sim;
          bestLabel = label;
        }
      }
    });

    let confidence = bestSim * 100;
    let label = bestLabel;

    console.log(`[AI Neural Diagnosis] Best Match: "${bestLabel}" with Similarity: ${confidence.toFixed(2)}%`);

    // Enforce robust cosine similarity threshold to filter weak/accidental matches
    if (confidence < 75 && label.toLowerCase() !== 'normal') {
      console.log(`[AI Neural Diagnosis] Similarity of ${confidence.toFixed(2)}% is below the 75% threshold. Safe-routing to "Normal".`);
      label = 'Normal';
      confidence = 100 - confidence; // Express confidence for baseline Normal guess
    }

    return {
      label: label,
      confidence: confidence
    };
  }

  async train(imgElement, label) {
    await this.initPromise;
    const features = this.extractFeatures(imgElement);
    this.classifier.addExample(features, label);
    return true;
  }
}

export const aiService = new AIService();
