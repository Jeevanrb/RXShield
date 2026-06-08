const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\jeeva\\.gemini\\antigravity\\brain\\b3f2a9a1-66c0-4d1d-b186-e6475ae3d8e4\\.system_generated\\logs\\transcript.jsonl';

const outDir = 'c:\\gravity\\recovered_files2';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function recover() {
  const text = fs.readFileSync(logPath, 'utf8');
  
  // gis flag makes it case insensitive
  const regex = /File Path: `file:\/\/\/(c:\/gravity\/[^`]+)`.*?((?:\\n\d+:\s.*?)+)\\nThe above content shows the entire/gis;
  
  let match;
  let fileIndex = 0;
  while ((match = regex.exec(text)) !== null) {
     let filePath = match[1].replace(/\//g, '_').replace(/:/g, '');
     let content = match[2];
     
     content = content.replace(/\\n/g, '\n');
     content = content.replace(/\\"/g, '"');
     content = content.replace(/\\\\/g, '\\');
     
     const codeLines = content.split('\n').map(l => l.replace(/^\d+:\s/, '')).filter(l => l.length > 0);
     
     fs.writeFileSync(path.join(outDir, `${fileIndex}_${filePath}.txt`), codeLines.join('\n'));
     fileIndex++;
  }
  console.log(`Recovered ${fileIndex} files to ${outDir}`);
}

recover();
