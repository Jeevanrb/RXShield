const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\jeeva\\.gemini\\antigravity\\brain\\b3f2a9a1-66c0-4d1d-b186-e6475ae3d8e4\\.system_generated\\logs\\transcript.jsonl';

const targetFiles = [
  'c:/gravity/src/context/DataStore.jsx',
  'c:/gravity/src/services/aiService.js',
  'c:/gravity/src/utils/imageValidator.js',
  'c:/gravity/src/utils/medicalKnowledge.js'
];

const latestContent = {};

async function recover() {
  const fileStream = fs.createReadStream(logPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'TOOL_RESPONSE' && entry.content) {
         try {
           const contentObj = JSON.parse(entry.content);
           if (contentObj.output && contentObj.output.includes('File Path:')) {
             const outputStr = contentObj.output;
             for (const file of targetFiles) {
                const fileUri = 'file:///' + file;
                if (outputStr.includes('File Path: `' + fileUri + '`')) {
                   const lines = outputStr.split('\n');
                   let codeLines = [];
                   let isCode = false;
                   for (const l of lines) {
                     if (l.match(/^\d+:\s/)) {
                       isCode = true;
                       codeLines.push(l.replace(/^\d+:\s/, ''));
                     } else if (isCode && l === 'The above content shows the entire, complete file contents of the requested file.') {
                       break;
                     }
                   }
                   if (codeLines.length > 0) {
                     latestContent[file] = codeLines.join('\n');
                   }
                }
             }
           }
         } catch(e) {}
      }
    } catch (e) {}
  }

  for (const [file, content] of Object.entries(latestContent)) {
    const outPath = file.replace(/\//g, '\\');
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outPath, content);
    console.log('Recovered:', outPath);
  }
}

recover();
