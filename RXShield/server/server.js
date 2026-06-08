import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, query, getLocalDb, saveFallback } from './db.js';
import { 
  analyzeInteractions, 
  analyzeAllergies, 
  analyzeContraindications, 
  getSaferAlternatives 
} from './engines.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// GET /api/drugs - Search and list medicines
app.get('/api/drugs', async (req, res) => {
  const search = req.query.q || '';
  const limit = parseInt(req.query.limit) || 50;
  try {
    // We execute the search query. The db.js routes it to PostgreSQL or local JSON file.
    // We prioritize medicines starting with the search string, followed by generics, then substrings, sorted alphabetically.
    const result = await query(
      `SELECT * FROM medicines 
       WHERE name ILIKE $1 OR generic_name ILIKE $1 OR drug_class ILIKE $2 
       ORDER BY 
         CASE 
           WHEN name ILIKE $2 THEN 1
           WHEN generic_name ILIKE $2 THEN 2
           WHEN name ILIKE $1 THEN 3
           WHEN generic_name ILIKE $1 THEN 4
           ELSE 5
         END,
         name ASC 
       LIMIT ${limit}`,
      [`%${search}%`, `${search}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching drugs:', err);
    res.status(500).json({ error: 'Failed to search medicines database' });
  }
});

// GET /api/drugs/:id - Get specific drug details
app.get('/api/drugs/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const localDb = getLocalDb();
    const drug = localDb.medicines.find(m => m.id === id);
    if (!drug) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    res.json(drug);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drug details' });
  }
});

// GET /api/patients - Get patient list
app.get('/api/patients', async (req, res) => {
  try {
    const result = await query('SELECT * FROM patients');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// POST /api/patients - Add a new patient
app.post('/api/patients', async (req, res) => {
  const { name, age, gender, weight, height, blood_group, allergies, existing_conditions } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Patient name is required' });
  }

  try {
    const result = await query(
      `INSERT INTO patients (name, age, gender, weight, height, blood_group, allergies, existing_conditions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name,
        parseInt(age) || null,
        gender || null,
        weight || null,
        height || null,
        blood_group || null,
        JSON.stringify(allergies || []),
        JSON.stringify(existing_conditions || [])
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating patient:', err);
    res.status(500).json({ error: 'Failed to create patient record' });
  }
});

// POST /api/analyze - Run AI Prescription analysis
app.post('/api/analyze', async (req, res) => {
  const { patientId, prescription } = req.body;
  
  if (!prescription || !Array.isArray(prescription) || prescription.length === 0) {
    return res.status(400).json({ error: 'Prescription list is empty' });
  }

  try {
    const localDb = getLocalDb();
    const drugDatabase = localDb.medicines;
    
    // Find patient details
    let patient = null;
    if (patientId) {
      patient = localDb.patients.find(p => p.id === parseInt(patientId));
    }

    // Run engines
    const interactionResults = analyzeInteractions(prescription, drugDatabase);
    const allergyWarnings = analyzeAllergies(prescription, patient, drugDatabase);
    const contraindicationWarnings = analyzeContraindications(prescription, patient, drugDatabase);
    
    // Generate safer alternatives
    const saferAlternatives = getSaferAlternatives(
      prescription,
      interactionResults.interactions,
      allergyWarnings,
      contraindicationWarnings,
      drugDatabase
    );

    // Compute custom safety recommendations
    let safetyScore = interactionResults.safetyScore;
    
    // Deduct safety points for allergies and contraindications
    allergyWarnings.forEach(() => { safetyScore = Math.max(0, safetyScore - 25); });
    contraindicationWarnings.forEach((c) => {
      const severityPenalty = c.severity === 'critical' ? 20 : (c.severity === 'high' ? 15 : 8);
      safetyScore = Math.max(0, safetyScore - severityPenalty);
    });

    let overallRecommendation = 'Prescription is safe and ready for patient dispensation. No major drug-to-drug interactions, allergies, or chronic disease contraindications were detected.';
    
    if (safetyScore < 40) {
      overallRecommendation = '🔴 CRITICAL WARNING: Prescription contains severe safety hazards. Potentially life-threatening allergies, severe organ loads, or dangerous drug interactions were flagged. Immediately substitute the highlighted drugs with safer alternatives.';
    } else if (safetyScore < 70) {
      overallRecommendation = '🟠 WARNING: Multiple moderate interactions or contraindications detected. Dosage monitoring, renal clearance panel checks, and strict patient vigilance are advised.';
    } else if (safetyScore < 90) {
      overallRecommendation = '🟡 ATTENTION: Low-level interactions or minor disease contraindications noted. Inform the patient of mild side effects and ensure proper administration timing.';
    }

    const report = {
      interactions: interactionResults.interactions,
      allergies: allergyWarnings,
      contraindications: contraindicationWarnings,
      alternatives: saferAlternatives,
      safetyScore: Math.round(safetyScore),
      recommendations: overallRecommendation
    };

    res.json(report);
  } catch (err) {
    console.error('Prescription analysis error:', err);
    res.status(500).json({ error: 'Engine failed to process prescription analysis' });
  }
});

// GET /api/reports - Get saved reports
app.get('/api/reports', async (req, res) => {
  try {
    const result = await query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve saved reports' });
  }
});

// POST /api/reports - Save report
app.post('/api/reports', async (req, res) => {
  const { patientId, patientName, prescription, riskScore, analysis } = req.body;
  try {
    const createdAt = new Date().toISOString();
    const result = await query(
      'INSERT INTO reports (patient_id, patient_name, prescription, risk_score, analysis, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [patientId, patientName, JSON.stringify(prescription), riskScore, JSON.stringify(analysis), createdAt]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving report:', err);
    res.status(500).json({ error: 'Failed to save analysis report' });
  }
});

// POST /api/chat - Clinical Chatbot AI Assistant
app.post('/api/chat', async (req, res) => {
  const { message, prescription } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Empty message' });
  }

  const queryText = message.toLowerCase();
  const localDb = getLocalDb();
  const drugDatabase = localDb.medicines;

  let response = '';

  // 1. Check for specific interactions mentioned
  let matchedInteractions = [];
  
  // Find if message mentions any drugs in the database
  const mentionedDrugs = drugDatabase.filter(d => 
    queryText.includes(d.name.toLowerCase()) || queryText.includes(d.generic_name.toLowerCase())
  );

  if (mentionedDrugs.length >= 2) {
    // Check if there are interactions between mentioned drugs
    for (let i = 0; i < mentionedDrugs.length; i++) {
      for (let j = i + 1; j < mentionedDrugs.length; j++) {
        const drugA = mentionedDrugs[i];
        const drugB = mentionedDrugs[j];
        
        const interact = drugA.interactions?.find(inter => 
          inter.with_drug.toLowerCase() === drugB.name.toLowerCase() ||
          inter.with_drug.toLowerCase() === drugB.generic_name.toLowerCase()
        ) || drugB.interactions?.find(inter => 
          inter.with_drug.toLowerCase() === drugA.name.toLowerCase() ||
          inter.with_drug.toLowerCase() === drugA.generic_name.toLowerCase()
        );

        if (interact) {
          matchedInteractions.push({ drugA: drugA.name, drugB: drugB.name, details: interact });
        }
      }
    }
  }

  if (matchedInteractions.length > 0) {
    const interact = matchedInteractions[0];
    response = `### Clinical Interaction detected: **${interact.drugA} + ${interact.drugB}**\n\n`;
    response += `* **Severity Level:** \`${interact.details.severity.toUpperCase()}\`\n`;
    response += `* **Mechanism of Action:** ${interact.details.mechanism}\n`;
    response += `* **Clinical Impact:** ${interact.details.impact}\n`;
    response += `* **Recommended Action:** ${interact.details.action}\n\n`;
    response += `I highly recommend looking at safer therapeutic alternatives to substitute this combination.`;
  }
  // 2. Check if questions are about side effects of a single drug
  else if (mentionedDrugs.length === 1 && (queryText.includes('side effect') || queryText.includes('adverse') || queryText.includes('organ') || queryText.includes('bad effect'))) {
    const drug = mentionedDrugs[0];
    const se = drug.side_effects;
    
    response = `### Side Effects Profile: **${drug.name} (${drug.generic_name})**\n\n`;
    response += `* **Common Side Effects:** ${se.common.join(', ')}.\n`;
    response += `* **Serious Adverse Reactions:** ${se.serious.join(', ')}.\n`;
    response += `* **Long-Term Treatment Effects:** ${se.long_term.join(', ')}.\n\n`;
    response += `#### Organ Toxicity Index:\n`;
    response += `* **Stomach Load:** \`${se.organ_impact.stomach}%\`\n`;
    response += `* **Kidney Load:** \`${se.organ_impact.kidneys}%\`\n`;
    response += `* **Liver Load:** \`${se.organ_impact.liver}%\`\n`;
    response += `* **Heart Load:** \`${se.organ_impact.heart}%\`\n`;
    response += `* **Brain Load:** \`${se.organ_impact.brain}%\`\n\n`;
    response += `* **Black Box Warning:** ${drug.warnings}`;
  }
  // 3. Check allergy questions
  else if (queryText.includes('allergy') || queryText.includes('allergic')) {
    if (mentionedDrugs.length === 1 && queryText.includes('penicillin') && mentionedDrugs[0].drug_class.includes('Penicillin')) {
      const drug = mentionedDrugs[0];
      response = `### ⚠️ CRITICAL ALLERGY ALERT: **Penicillin Allergy vs ${drug.name}**\n\n`;
      response += `**Amoxicillin** and other penicillins belong to the beta-lactam antibiotic class. Since the patient has a documented **Penicillin Allergy**, administration of ${drug.name} is **contraindicated** due to high risk of cross-reactivity.\n\n`;
      response += `* **Potential Reaction:** Anaphylaxis, bronchospasm, hives, swelling, and acute circulatory collapse.\n`;
      response += `* **Alternative Recommendation:** Substitute with non-penicillin antibiotics like **Azithromycin** (Macrolide class) or **Cephalexin** (Cephalosporin class, though with caution as 5-10% cross-reactivity exists).`;
    } else {
      response = `To analyze drug allergies, please select a patient from the dropdown on the **Prescription Checker** panel. The system will automatically run cross-reactivity checks against patient allergies (such as Penicillin allergies vs Amoxicillin, or NSAID allergies vs Ibuprofen) and flag warning banners instantly.`;
    }
  }
  // 4. Check if questions are about a drug's general information
  else if (mentionedDrugs.length === 1) {
    const drug = mentionedDrugs[0];
    response = `### Clinical Reference: **${drug.name} (${drug.generic_name})**\n\n`;
    response += `* **Therapeutic Class:** ${drug.drug_class}\n`;
    response += `* **Primary Clinical Uses:** ${drug.uses}\n`;
    response += `* **Biochemical Mechanism:** ${drug.mechanism}\n`;
    response += `* **Available Dosages:** ${drug.dosages.join(', ')}\n`;
    response += `* **Storage Guidelines:** ${drug.storage}\n\n`;
    response += `*⚠️ **Black Box warnings:** ${drug.warnings}*`;
  }
  // 5. Default conversational responder
  else {
    // If a prescription is active, pull details to help contextualize
    const activePrescText = prescription && prescription.length > 0
      ? `The active prescription contains: ${prescription.map(p => `${p.name} (${p.dosage})`).join(', ')}.`
      : "There is currently no active prescription loaded in the builder.";

    response = `Hello! I am your **Clinical Health Intelligence Advisor**. I can assist you with drug interactions, side effects, allergies, and contraindications.

${activePrescText}

**Suggested Queries you can ask me:**
1. "Is it safe to prescribe Warfarin and Aspirin together?" (Checks interactions)
2. "Show me the side effects of Metformin." (Retrieves organ toxicity and side effects)
3. "Can I take Amoxicillin if I'm allergic to Penicillin?" (Checks allergy pathways)
4. "Tell me about Albuterol." (Fetches drug class, uses, and mechanism)

How can I help you support patient safety today?`;
  }

  res.json({ text: response });
});

// Start backend
app.listen(PORT, async () => {
  await initDb();
  console.log(`🚀 AI Prescription Advisor Server running on port ${PORT}`);
});
