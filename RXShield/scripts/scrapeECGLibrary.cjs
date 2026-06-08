const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ecglibrary.com/';
const TRAINING_DIR = path.join(__dirname, '../training_data');
const KNOWLEDGE_FILE = path.join(__dirname, '../src/utils/medicalKnowledge.js');

if (!fs.existsSync(TRAINING_DIR)) {
    fs.mkdirSync(TRAINING_DIR, { recursive: true });
}

async function scrapeLibrary() {
    console.log('Fetching ECG Library Homepage...');
    const response = await axios.get(`${BASE_URL}ecghome.php`);
    const $ = cheerio.load(response.data);
    
    const conditionLinks = [];
    
    // In ecghome.php, the conditions are listed under h3 tags as anchor tags
    $('h3').nextUntil('h3').each((i, el) => {
        if (el.tagName === 'a') {
            const href = $(el).attr('href');
            const title = $(el).text().trim();
            if (href && !href.startsWith('#') && !href.includes('about') && !href.includes('ecghist')) {
                conditionLinks.push({ title, url: BASE_URL + href });
            }
        } else if (el.tagName === 'br') {
            // Some are separated by br, we might need to find a tags inside the block
            $(el).nextAll('a').first().each((j, childA) => {
                const href = $(childA).attr('href');
                const title = $(childA).text().trim();
                if (href && !href.startsWith('#') && !href.includes('about')) {
                     conditionLinks.push({ title, url: BASE_URL + href });
                }
            });
        }
    });

    // Alternatively, just grab all a tags that are likely conditions (between certain blocks)
    // A simpler way: grab all <a> tags that don't go to .php homepages.
    const uniqueLinks = new Map();
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();
        if (href && 
           (href.endsWith('.html') || href.endsWith('.php')) && 
           !href.includes('ecghome') && 
           !href.includes('norm') &&
           !href.includes('axis') &&
           !href.includes('ecghist') &&
           !href.includes('about') &&
           !href.includes('ecgsbyeg') &&
           title.length > 5) {
            uniqueLinks.set(title, BASE_URL + href);
        }
    });

    console.log(`Found ${uniqueLinks.size} unique condition pages.`);
    
    const scrapedKnowledge = {};

    for (const [title, url] of uniqueLinks.entries()) {
        try {
            console.log(`\nScraping: ${title} (${url})`);
            const pageRes = await axios.get(url);
            const $page = cheerio.load(pageRes.data);
            
            // Find the main image
            let imgUrl = null;
            $page('img').each((i, img) => {
                const src = $page(img).attr('src');
                if (src && !src.includes('logo') && !src.includes('banner')) {
                    imgUrl = src.startsWith('http') ? src : BASE_URL + src;
                    return false; // break loop
                }
            });

            if (!imgUrl) {
                console.log(`No image found for ${title}. Skipping.`);
                continue;
            }

            // Download image
            const imgResponse = await axios({ url: imgUrl, responseType: 'stream' });
            const ext = path.extname(imgUrl).split('?')[0] || '.gif';
            const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const imgPath = path.join(TRAINING_DIR, `${safeTitle}${ext}`);
            
            const writer = fs.createWriteStream(imgPath);
            imgResponse.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`Saved image to ${imgPath}`);

            // Extract bullet points (ul li) for criteria
            const criteria = [];
            $page('ul li').each((i, li) => {
                const text = $page(li).text().replace(/\s+/g, ' ').trim();
                if (text.length > 10) criteria.push(text);
            });
            
            if (criteria.length === 0) {
                 // Try getting paragraph text if no bullets
                 $page('p').each((i, p) => {
                    const text = $page(p).text().trim();
                    if (text.length > 20 && text.length < 150) criteria.push(text);
                 });
            }

            scrapedKnowledge[safeTitle.replace(/-/g, ' ')] = {
                description: title,
                criteria: criteria.slice(0, 5) // Keep top 5 criteria
            };
            
        } catch (err) {
            console.error(`Failed to scrape ${title}: ${err.message}`);
        }
        
        // Be nice to the server
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\nScraping complete. Generating medicalKnowledge.js...');
    generateKnowledgeFile(scrapedKnowledge);
}

function generateKnowledgeFile(newKnowledge) {
    let existingContent = '';
    if (fs.existsSync(KNOWLEDGE_FILE)) {
        existingContent = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
    }
    
    // We will append to the existing object or reconstruct it
    let fileContent = `// Auto-generated Knowledge Base\n\nexport const clinicalCriteria = {\n`;
    
    // Add existing normal logic if not present in new
    if (existingContent.includes('normal: {') && !newKnowledge['normal']) {
        fileContent += `  normal: {
    description: "Normal Sinus Rhythm",
    criteria: [
      "P Wave: < 2.5mm height, < 0.11s width (Normal atrial depolarization)",
      "PR Interval: 0.12 - 0.20s (Normal AV node conduction)",
      "QRS Complex: < 0.12s duration (Normal ventricular depolarization)",
      "QT Interval: Corrected QT (QTc) ~0.42s",
      "ST Segment: Isoelectric, no elevation or depression",
      "T Wave: Upright, representing normal ventricular repolarization"
    ]
  },\n`;
    }

    for (const [key, data] of Object.entries(newKnowledge)) {
        fileContent += `  '${key}': {\n`;
        fileContent += `    description: "${data.description.replace(/"/g, "'")}",\n`;
        fileContent += `    criteria: [\n`;
        data.criteria.forEach((c, idx) => {
            fileContent += `      "${c.replace(/"/g, "'")}"${idx < data.criteria.length - 1 ? ',' : ''}\n`;
        });
        fileContent += `    ]\n  },\n`;
    }
    
    // Close object and add helper
    fileContent += `};\n\n`;
    fileContent += `export const getCriteriaForDiagnosis = (label) => {
    if (!label) return null;
    const lowerLabel = label.toLowerCase();
    for (const key in clinicalCriteria) {
        if (lowerLabel.includes(key)) {
            return clinicalCriteria[key];
        }
    }
    return null;
}\n`;

    fs.writeFileSync(KNOWLEDGE_FILE, fileContent);
    console.log('Successfully updated src/utils/medicalKnowledge.js');
}

scrapeLibrary().catch(console.error);
