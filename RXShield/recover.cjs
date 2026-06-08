const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = String.raw`C:\Users\jeeva\.gemini\antigravity\brain\b3f2a9a1-66c0-4d1d-b186-e6475ae3d8e4\.system_generated\logs\transcript.jsonl`;

const targetFiles = [
  'c:\\gravity\\src\\context\\DataStore.jsx',
  'c:\\gravity\\src\\services\\aiService.js',
  'c:\\gravity\\src\\utils\\imageValidator.js',
  'c:\\gravity\\src\\utils\\medicalKnowledge.js'
];

// We will store the latest known full content of each file
const latestContent = {};

async function recover() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.tool_calls) {
        for (const call of entry.tool_calls) {
          if (call.name === 'default_api:view_file') {
             // We don't get the output in tool_calls, we get it in the tool_response
          }
        }
      }
      if (entry.type === 'TOOL_RESPONSE' && entry.content) {
         // The content is a stringified JSON if it's from a tool
         try {
           const contentObj = JSON.parse(entry.content);
           if (contentObj.output) {
             const outputStr = contentObj.output;
             for (const file of targetFiles) {
                // If it's a view_file output
                const fileUri = 'file:///' + file.replace(/\\/g, '/');
                if (outputStr.includes('File Path: `' + fileUri + '`')) {
                   // Extract the lines
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
    } catch (e) {
      console.error(e);
    }
  }

  for (const [file, content] of Object.entries(latestContent)) {
    const dir = path.dirname(file);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, content);
    console.log('Recovered:', file);
  }
}

recover();
