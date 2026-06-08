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
    const content = data.content || '';
    if (content.includes('media__')) {
      const match = content.match(/media__\d+\.(png|jpg)/g);
      if (match) {
        console.log(`Step ${data.step_index} (${data.type}):`);
        console.log(`  Matches: ${match.join(', ')}`);
        // Print snippet of context
        const lines = content.split('\n').filter(l => l.includes('media__'));
        lines.forEach(l => console.log(`  Line: ${l.trim().substring(0, 120)}`));
      }
    }
  }
}

parseLogs().catch(console.error);
