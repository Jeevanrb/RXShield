import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/jeeva/.gemini/antigravity/brain/61a24e79-4bb2-4170-8aaa-580febc177d2/.system_generated/logs/transcript.jsonl';

async function parseLogs() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const firstOccurrence = {};
  const steps = {};

  for await (const line of rl) {
    const data = JSON.parse(line);
    steps[data.step_index] = data;

    const content = data.content || '';
    const tcStr = data.tool_calls ? JSON.stringify(data.tool_calls) : '';
    
    // Find all media files in this step
    const matches = (content + ' ' + tcStr).match(/media__\d+\.(png|jpg)/g) || [];
    
    matches.forEach(m => {
      if (firstOccurrence[m] === undefined) {
        firstOccurrence[m] = data.step_index;
      }
    });
  }

  console.log('First Occurrences and Contexts:');
  Object.keys(firstOccurrence).sort().forEach(media => {
    const idx = firstOccurrence[media];
    console.log(`\n=========================================`);
    console.log(`${media} first appeared at Step ${idx}:`);
    
    // Scan backwards to find the closest USER_INPUT
    let userInputStep = null;
    for (let i = idx; i >= 0; i--) {
      if (steps[i] && steps[i].type === 'USER_INPUT') {
        userInputStep = steps[i];
        break;
      }
    }
    
    if (userInputStep) {
      console.log(`  USER REQUEST (Step ${userInputStep.step_index}):`);
      console.log(`    ${userInputStep.content}`);
    } else {
      console.log(`  No user input context found before step ${idx}`);
    }
    
    const step = steps[idx];
    console.log(`  STEP ${idx} DETAILS (${step.type}, ${step.source}):`);
    console.log(`    ${step.content?.substring(0, 500)}`);
  });
}

parseLogs().catch(console.error);
