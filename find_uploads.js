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
    // Search for steps of type USER_INPUT or those containing image references in text
    if (data.type === 'USER_INPUT' || data.content?.includes('media__') || data.tool_calls?.some(tc => JSON.stringify(tc).includes('media__'))) {
      console.log(`Step ${data.step_index} (${data.type}, Source: ${data.source}):`);
      console.log(`  Content: ${data.content?.substring(0, 300).replace(/\n/g, ' ')}...`);
      if (data.tool_calls) {
        console.log(`  Tool Calls: ${JSON.stringify(data.tool_calls).substring(0, 200)}...`);
      }
    }
  }
}

parseLogs().catch(console.error);
