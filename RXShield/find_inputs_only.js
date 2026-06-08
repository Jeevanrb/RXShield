import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/jeeva/.gemini/antigravity/brain/61a24e79-4bb2-4170-8aaa-580febc177d2/.system_generated/logs/transcript.jsonl';

async function parseLogs() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT') {
      const content = data.content || '';
      if (content.includes('media__') || content.includes('.png') || content.includes('.jpg')) {
        console.log(`Step ${data.step_index}:`);
        console.log(`  Content: ${content.trim().substring(0, 500)}`);
      }
    }
  }
}

parseLogs().catch(console.error);
