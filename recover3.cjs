const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\jeeva\\.gemini\\antigravity\\brain\\b3f2a9a1-66c0-4d1d-b186-e6475ae3d8e4\\.system_generated\\logs\\transcript.jsonl';

const outDir = 'c:\\gravity\\recovered_files';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function recover() {
  const fileStream = fs.createReadStream(logPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let fileIndex = 0;
  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'TOOL_RESPONSE' && entry.content) {
         try {
           const contentObj = JSON.parse(entry.content);
           if (contentObj.output && contentObj.output.includes('File Path:')) {
             
             // Extract file path from string
             const match = contentObj.output.match(/File Path: `file:\/\/\/(.+?)`/);
             if (match) {
                const filePath = match[1].replace(/\//g, '_').replace(/:/g, '');
                
                const lines = contentObj.output.split('\n');
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
                   fs.writeFileSync(path.join(outDir, `${fileIndex}_${filePath}.txt`), codeLines.join('\n'));
                   fileIndex++;
                }
             }
           }
         } catch(e) {}
      }
    } catch (e) {}
  }
  console.log(`Recovered ${fileIndex} files to ${outDir}`);
}

recover();
