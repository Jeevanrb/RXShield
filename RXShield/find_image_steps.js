import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/jeeva/.gemini/antigravity/brain/61a24e79-4bb2-4170-8aaa-580febc177d2/.system_generated/logs/transcript.jsonl';

async function parseLogs() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const mediaToStep = {};
  const steps = {};

  for await (const line of rl) {
    const data = JSON.parse(line);
    steps[data.step_index] = data;

    // Search for media references in tool calls or content
    const content = data.content || '';
    const matches = content.match(/media__\d+\.(png|jpg)/g) || [];
    
    // Check tool calls
    if (data.tool_calls) {
      const tcStr = JSON.stringify(data.tool_calls);
      const tcMatches = tcStr.match(/media__\d+\.(png|jpg)/g) || [];
      matches.push(...tcMatches);
    }

    matches.forEach(m => {
      if (!mediaToStep[m]) {
        mediaToStep[m] = [];
      }
      mediaToStep[m].push(data.step_index);
    });
  }

  console.log('Media File Mapping:');
  Object.keys(mediaToStep).sort().forEach(media => {
    console.log(`\n${media}:`);
    const stepIndices = mediaToStep[media];
    stepIndices.forEach(idx => {
      const step = steps[idx];
      console.log(`  - Step ${idx} (${step.type}, ${step.source}):`);
      // Find the user request text before this step
      let reqText = '';
      for (let i = idx; i >= Math.max(0, idx - 3); i--) {
        if (steps[i] && steps[i].type === 'USER_INPUT') {
          reqText = steps[i].content || '';
          break;
        }
      }
      console.log(`    Request Context: ${reqText.substring(0, 150).replace(/\n/g, ' ')}...`);
    });
  });
}

parseLogs().catch(console.error);
