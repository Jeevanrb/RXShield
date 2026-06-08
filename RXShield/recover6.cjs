const fs = require('fs');

const logPath = 'C:\\Users\\jeeva\\.gemini\\antigravity\\brain\\b3f2a9a1-66c0-4d1d-b186-e6475ae3d8e4\\.system_generated\\logs\\transcript.jsonl';

const lines = fs.readFileSync(logPath, 'utf8').split('\n');

let latestDataStore = null;
let latestAIService = null;

for (const line of lines) {
  if (!line) continue;
  try {
    const entry = JSON.parse(line);
    if (entry.type === 'TOOL_RESPONSE' && entry.content) {
      if (entry.content.includes('DataStore.jsx')) {
         if (entry.content.includes('The following code has been modified to include a line number')) {
             latestDataStore = entry.content;
         }
      }
      if (entry.content.includes('aiService.js')) {
         if (entry.content.includes('The following code has been modified to include a line number')) {
             latestAIService = entry.content;
         }
      }
    }
  } catch (e) {}
}

function extractCode(content) {
  try {
    const obj = JSON.parse(content);
    const output = obj.output;
    const codeLines = [];
    let isCode = false;
    for (const l of output.split('\n')) {
      if (l.match(/^\d+:\s/)) {
        isCode = true;
        codeLines.push(l.replace(/^\d+:\s/, ''));
      } else if (isCode && l.includes('The above content shows the entire')) {
        break;
      }
    }
    return codeLines.join('\n');
  } catch(e) {
    // maybe it's not JSON
    const codeLines = [];
    let isCode = false;
    for (const l of content.split(/\\n|\n/)) {
      if (l.match(/^\d+:\s/)) {
        isCode = true;
        codeLines.push(l.replace(/^\d+:\s/, ''));
      } else if (isCode && l.includes('The above content shows the entire')) {
        break;
      }
    }
    return codeLines.join('\n');
  }
}

if (latestDataStore) {
  fs.writeFileSync('c:\\gravity\\recovered_DataStore.jsx', extractCode(latestDataStore));
  console.log('Saved DataStore.jsx');
}
if (latestAIService) {
  fs.writeFileSync('c:\\gravity\\recovered_aiService.js', extractCode(latestAIService));
  console.log('Saved aiService.js');
}
