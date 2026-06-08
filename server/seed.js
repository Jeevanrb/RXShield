import { initDb, getLocalDb, setLocalDb, isFallback, query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRUG_CLASSES = {
  NSAID: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
  ANTICOAGULANT: 'Anticoagulant (Blood Thinner)',
  ANTIBIOTIC_PENICILLIN: 'Penicillin Antibiotic',
  ANTIBIOTIC_MACROLIDE: 'Macrolide Antibiotic',
  ANTIBIOTIC_FLUOROQUINOLONE: 'Fluoroquinolone Antibiotic',
  BETA_BLOCKER: 'Beta-Adrenergic Blocker',
  ACE_INHIBITOR: 'ACE Inhibitor (Antihypertensive)',
  CALCIUM_CHANNEL_BLOCKER: 'Calcium Channel Blocker',
  STATIN: 'HMG-CoA Reductase Inhibitor (Statin)',
  ANTIDIABETIC_BIGUANIDE: 'Biguanide Oral Hypoglycemic',
  ANTIDIABETIC_SULFONYLUREA: 'Sulfonylurea Oral Hypoglycemic',
  BRONCHODILATOR: 'Beta2-Adrenergic Agonist (Bronchodilator)',
  PROTON_PUMP_INHIBITOR: 'Proton Pump Inhibitor (Acid Reducer)',
  SSRI: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
  ANTIHISTAMINE: 'H1-Receptor Antagonist (Antihistamine)',
  DIURETIC_LOOP: 'Loop Diuretic',
  DIURETIC_THIAZIDE: 'Thiazide Diuretic',
  NITRATE: 'Vasodilator (Nitrate)',
  STEROID: 'Corticosteroid'
};

// Core drugs list with highly specific interactions, contraindications, and organ loads
const CORE_DRUGS = [
  {
    name: 'Warfarin',
    generic_name: 'Warfarin',
    drug_class: DRUG_CLASSES.ANTICOAGULANT,
    dosages: ['1mg', '2mg', '2.5mg', '5mg', '10mg'],
    warnings: 'Major bleeding risk. Requires regular INR blood monitoring. Do not take with NSAIDs or Aspirin.',
    uses: 'Prophylaxis and treatment of venous thrombosis, pulmonary embolism, and thromboembolic complications associated with atrial fibrillation.',
    mechanism: 'Inhibits Vitamin K epoxide reductase, depleting functional Vitamin K-dependent clotting factors (II, VII, IX, and X).',
    storage: 'Store at 20°C to 25°C (68°F to 77°F) in a tight, light-resistant container.',
    common_effects: ['Bruising', 'Minor bleeding', 'Nausea', 'Abdominal pain', 'Pale skin'],
    serious_effects: ['Severe bleeding', 'Hematuria', 'Melena (black stools)', 'Hemorrhagic stroke', 'Purple toes syndrome'],
    long_term_effects: ['Osteoporosis risk', 'Calciphylaxis (vascular calcification)', 'Hepatic enzyme elevation'],
    organ_impact: { brain: 40, heart: 20, liver: 45, kidneys: 25, lungs: 10, stomach: 50 },
    contraindications: ['Pregnancy', 'Severe liver disease', 'Active peptic ulcer disease', 'Uncontrolled hypertension'],
    interactions: [
      {
        with_drug: 'Aspirin',
        severity: 'critical',
        mechanism: 'Synergistic antiplatelet and anticoagulant effects, compounded by mucosal irritation.',
        impact: 'Extreme risk of severe internal gastrointestinal bleeding and hemorrhagic stroke.',
        action: 'Avoid combination. Use alternative analgesics like Paracetamol. If mandatory, monitor INR daily and prescribe proton pump inhibitors.'
      },
      {
        with_drug: 'Ibuprofen',
        severity: 'critical',
        mechanism: 'NSAID-induced inhibition of platelet aggregation and gastric mucosal damage combined with anticoagulant actions.',
        impact: 'High risk of acute gastrointestinal bleeding and ulceration.',
        action: 'Contraindicated. Discontinue Ibuprofen. Substitute with Acetaminophen (Paracetamol) for pain control.'
      },
      {
        with_drug: 'Amiodarone',
        severity: 'high',
        mechanism: 'Amiodarone inhibits CYP2C9 metabolic pathway of Warfarin, increasing Warfarin plasma concentration.',
        impact: 'Elevated INR, leading to spontaneous bruising and bleeding.',
        action: 'Reduce Warfarin dose by 30-50% when initiating Amiodarone. Check INR twice weekly.'
      }
    ],
    alternatives: [
      { name: 'Eliquis', generic_name: 'Apixaban', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$$$', effectiveness_score: 95 },
      { name: 'Xarelto', generic_name: 'Rivaroxaban', safety_rating: 4.5, interaction_risk: 'moderate', price_estimate: '$$$', effectiveness_score: 93 }
    ]
  },
  {
    name: 'Aspirin',
    generic_name: 'Aspirin',
    drug_class: DRUG_CLASSES.NSAID,
    dosages: ['81mg', '325mg', '500mg'],
    warnings: 'Gastrointestinal bleeding risk. Risk of Reye\'s syndrome in children. Avoid in patients with active ulcers.',
    uses: 'Management of mild to moderate pain, inflammation, and fever. Lower doses (81mg) are used as cardioprotective antiplatelet agents.',
    mechanism: 'Irreversibly inhibits cyclooxygenase-1 and 2 (COX-1 and COX-2) enzymes, preventing prostaglandin and thromboxane A2 synthesis.',
    storage: 'Keep in a cool, dry place. Avoid moisture.',
    common_effects: ['Dyspepsia', 'Heartburn', 'Nausea', 'Easy bruising'],
    serious_effects: ['Gastrointestinal ulceration', 'Tinnitus (salicylate toxicity)', 'Anaphylaxis', 'Asthma exacerbation'],
    long_term_effects: ['Gastric mucosal atrophy', 'Renal papillary necrosis', 'Anemia due to chronic micro-bleeding'],
    organ_impact: { brain: 15, heart: 10, liver: 20, kidneys: 40, lungs: 15, stomach: 75 },
    contraindications: ['Asthma', 'Kidney disease', 'Peptic ulcer disease', 'Hemophilia'],
    interactions: [
      {
        with_drug: 'Warfarin',
        severity: 'critical',
        mechanism: 'Increased bleeding tendency via dual pathways (antiplatelet + anticoagulant).',
        impact: 'Severe internal bleeding, mucosal hemorrhage.',
        action: 'Discontinue Aspirin unless specifically prescribed as low-dose dual antiplatelet therapy. Monitor closely.'
      },
      {
        with_drug: 'Ibuprofen',
        severity: 'moderate',
        mechanism: 'Ibuprofen competitively blocks Aspirin access to the COX-1 active site, diminishing cardioprotective antiplatelet effects.',
        impact: 'Decreased cardiac protective efficacy of low-dose Aspirin, increased gastric irritation.',
        action: 'Take Aspirin at least 30 minutes before or 8 hours after Ibuprofen.'
      }
    ],
    alternatives: [
      { name: 'Tylenol', generic_name: 'Paracetamol', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 90 },
      { name: 'Celebrex', generic_name: 'Celecoxib', safety_rating: 4.0, interaction_risk: 'moderate', price_estimate: '$$', effectiveness_score: 88 }
    ]
  },
  {
    name: 'Ibuprofen',
    generic_name: 'Ibuprofen',
    drug_class: DRUG_CLASSES.NSAID,
    dosages: ['200mg', '400mg', '600mg', '800mg'],
    warnings: 'May increase the risk of serious cardiovascular thrombotic events, myocardial infarction, and stroke. Can cause severe gastrointestinal bleeding.',
    uses: 'Relief of signs and symptoms of rheumatoid arthritis and osteoarthritis. Relief of mild to moderate pain and treatment of primary dysmenorrhea.',
    mechanism: 'Reversibly inhibits COX-1 and COX-2 enzymes, decreasing synthesis of inflammatory prostaglandins.',
    storage: 'Store at room temperature in a tightly closed container.',
    common_effects: ['Stomach upset', 'Headache', 'Dizziness', 'Fluid retention'],
    serious_effects: ['Peptic ulcer disease', 'Acute kidney injury', 'Myocardial infarction', 'Hypertensive crisis'],
    long_term_effects: ['Renal impairment', 'Chronic gastritis', 'Elevated cardiovascular risk'],
    organ_impact: { brain: 10, heart: 35, liver: 25, kidneys: 55, lungs: 10, stomach: 80 },
    contraindications: ['Asthma', 'Kidney disease', 'Liver disease', 'Hypertension', 'Heart disease', 'Pregnancy'],
    interactions: [
      {
        with_drug: 'Warfarin',
        severity: 'critical',
        mechanism: 'Dual blockade of clotting mechanisms and gastric barrier destruction.',
        impact: 'Dangerous gastrointestinal bleeding and hemorrhage.',
        action: 'Contraindicated. Do not prescribe together. Switch to Paracetamol.'
      },
      {
        with_drug: 'Lisinopril',
        severity: 'high',
        mechanism: 'NSAIDs decrease vasodilator prostaglandins, causing renal afferent arteriolar constriction while Lisinopril dilates efferent arterioles, drastically lowering GFR.',
        impact: 'Acute renal failure and loss of blood pressure control.',
        action: 'Avoid concurrent use in elderly or kidney patients. Monitor creatinine levels and blood pressure if used together.'
      }
    ],
    alternatives: [
      { name: 'Tylenol', generic_name: 'Paracetamol', safety_rating: 4.9, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 87 },
      { name: 'Mobic', generic_name: 'Meloxicam', safety_rating: 4.2, interaction_risk: 'moderate', price_estimate: '$$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Amoxicillin',
    generic_name: 'Amoxicillin',
    drug_class: DRUG_CLASSES.ANTIBIOTIC_PENICILLIN,
    dosages: ['250mg', '500mg', '875mg'],
    warnings: 'Contraindicated in patients with known penicillin hypersensitivity (allergic reaction). Can cause severe anaphylaxis.',
    uses: 'Treatment of infections of the ear, nose, throat, genitourinary tract, skin, and lower respiratory tract caused by susceptible bacteria.',
    mechanism: 'Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), leading to bacterial cell lysis.',
    storage: 'Keep oral suspension refrigerated. Store capsules at room temperature.',
    common_effects: ['Diarrhea', 'Nausea', 'Vomiting', 'Skin rash', 'Oral thrush'],
    serious_effects: ['Anaphylaxis (breathing difficulty)', 'Stevens-Johnson syndrome', 'Clostridioides difficile-associated diarrhea (CDAD)'],
    long_term_effects: ['Disruption of gut microbiome', 'Development of bacterial resistance'],
    organ_impact: { brain: 5, heart: 5, liver: 20, kidneys: 35, lungs: 5, stomach: 30 },
    contraindications: ['Allergies'], // Note: Allergies check is dynamic (matches Penicillin class)
    interactions: [
      {
        with_drug: 'Methotrexate',
        severity: 'moderate',
        mechanism: 'Penicillins compete for active renal tubular secretion of methotrexate, increasing its plasma levels.',
        impact: 'Methotrexate toxicity (bone marrow suppression, oral ulcers).',
        action: 'Avoid combination. Monitor methotrexate blood concentrations closely if co-administered.'
      }
    ],
    alternatives: [
      { name: 'Zithromax', generic_name: 'Azithromycin', safety_rating: 4.6, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 92 },
      { name: 'Keflex', generic_name: 'Cephalexin', safety_rating: 4.1, interaction_risk: 'moderate', price_estimate: '$', effectiveness_score: 89 }
    ]
  },
  {
    name: 'Lisinopril',
    generic_name: 'Lisinopril',
    drug_class: DRUG_CLASSES.ACE_INHIBITOR,
    dosages: ['5mg', '10mg', '20mg', '40mg'],
    warnings: 'Can cause fetal harm or death when used in pregnancy. Risk of angioedema (life-threatening swelling of throat/face). Can cause dry cough.',
    uses: 'Treatment of hypertension, heart failure (as adjunctive therapy), and to improve survival after myocardial infarction.',
    mechanism: 'Inhibits angiotensin-converting enzyme (ACE), blocking conversion of angiotensin I to the potent vasoconstrictor angiotensin II, thereby reducing systemic vascular resistance and aldosterone secretion.',
    storage: 'Store at 15°C to 30°C (59°F to 86°F) in a well-closed container.',
    common_effects: ['Dry hacking cough', 'Dizziness', 'Headache', 'Hyperkalemia', 'Hypotension'],
    serious_effects: ['Angioedema', 'Renal impairment', 'Hyperkalemia crisis', 'Neutropenia'],
    long_term_effects: ['Stable control of hypertension', 'Kidney function preservation in diabetic nephropathy (but contraindicated in bilateral renal artery stenosis)'],
    organ_impact: { brain: 10, heart: 20, liver: 10, kidneys: 45, lungs: 25, stomach: 15 },
    contraindications: ['Pregnancy', 'Kidney disease', 'Liver disease'],
    interactions: [
      {
        with_drug: 'Ibuprofen',
        severity: 'high',
        mechanism: 'NSAIDs inhibit vasodilatory prostaglandins, reducing Lisinopril effectiveness and triggering acute renal constriction.',
        impact: 'Hypertensive rebound, acute kidney injury.',
        action: 'Monitor renal panels and blood pressure. Minimize NSAID usage; use Paracetamol for pain.'
      },
      {
        with_drug: 'Spironolactone',
        severity: 'high',
        mechanism: 'Additive potassium-retaining effects of Spironolactone (aldosterone antagonist) and Lisinopril (decreases aldosterone).',
        impact: 'Severe hyperkalemia (high blood potassium) leading to cardiac arrhythmias and arrest.',
        action: 'Monitor serum potassium levels weekly. Advise low-potassium diet. Keep Spironolactone dosage low (e.g. 12.5-25mg).'
      }
    ],
    alternatives: [
      { name: 'Cozaar', generic_name: 'Losartan', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 93 },
      { name: 'Norvasc', generic_name: 'Amlodipine', safety_rating: 4.4, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 91 }
    ]
  },
  {
    name: 'Metformin',
    generic_name: 'Metformin',
    drug_class: DRUG_CLASSES.ANTIDIABETIC_BIGUANIDE,
    dosages: ['500mg', '850mg', '1000mg'],
    warnings: 'Lactic acidosis (rare but fatal build up of lactic acid in blood). Contraindicated in patients with severe renal impairment (eGFR < 30 mL/min).',
    uses: 'First-line medication for the treatment of type 2 diabetes, particularly in overweight people.',
    mechanism: 'Decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.',
    storage: 'Store at room temperature away from moisture and direct sunlight.',
    common_effects: ['Diarrhea', 'Nausea', 'Flatulence', 'Metallic taste', 'Abdominal discomfort'],
    serious_effects: ['Lactic acidosis (fatigue, muscle pain, hyperventilation)', 'Vitamin B12 deficiency', 'Severe hypoglycemia (when combined with insulin/sulfonylureas)'],
    long_term_effects: ['B12 malabsorption', 'Cardiovascular mortality reduction in diabetics'],
    organ_impact: { brain: 5, heart: 10, liver: 30, kidneys: 70, lungs: 5, stomach: 45 },
    contraindications: ['Kidney disease', 'Liver disease', 'Heart disease'],
    interactions: [
      {
        with_drug: 'Contrast Media (Iodinated)',
        severity: 'high',
        mechanism: 'Iodinated contrast can cause acute renal failure, which results in Metformin accumulation and severe lactic acidosis.',
        impact: 'Metformin toxicity and life-threatening lactic acidosis.',
        action: 'Discontinue Metformin prior to, or at the time of, iodinated contrast imaging and withhold for 48 hours post-procedure until renal function is verified normal.'
      }
    ],
    alternatives: [
      { name: 'Jardiance', generic_name: 'Empagliflozin', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$$$', effectiveness_score: 95 },
      { name: 'Januvia', generic_name: 'Sitagliptin', safety_rating: 4.5, interaction_risk: 'low', price_estimate: '$$$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Nitroglycerin',
    generic_name: 'Nitroglycerin',
    drug_class: DRUG_CLASSES.NITRATE,
    dosages: ['0.4mg sublingual', '0.1mg/hr patch', '0.2mg/hr patch'],
    warnings: 'Can cause severe hypotension. Contraindicated with phosphodiesterase-5 (PDE-5) inhibitors like Sildenafil (Viagra).',
    uses: 'Acute relief of an attack or prophylaxis of angina pectoris due to coronary artery disease.',
    mechanism: 'Relaxes vascular smooth muscle. Direct dilator of coronary arteries, promoting blood redistribution and reducing venous return (preload) which lowers cardiac workload.',
    storage: 'Keep in the original glass container, tightly capped. Do not store in plastic.',
    common_effects: ['Throbbing headache', 'Flushing', 'Dizziness', 'Postural hypotension', 'Tachycardia'],
    serious_effects: ['Severe syncope (fainting)', 'Methemoglobinemia (rare)', 'Reflex tachycardia exacerbating ischemia'],
    long_term_effects: ['Nitrate tolerance (decreased effectiveness over time, requiring a 10-12 hour nitrate-free interval daily)'],
    organ_impact: { brain: 20, heart: 40, liver: 15, kidneys: 20, lungs: 15, stomach: 10 },
    contraindications: ['Heart disease', 'Hypertension'], // Contraindicated in severe aortic stenosis, hypertrophic cardiomyopathy, hypotension
    interactions: [
      {
        with_drug: 'Sildenafil',
        severity: 'critical',
        mechanism: 'PDE-5 inhibitors prolong Nitroglycerin-induced cGMP-mediated vasodilation, leading to systemic blood pressure collapse.',
        impact: 'Severe, refractory hypotension, myocardial infarction, and death.',
        action: 'Absolutely contraindicated. Do not administer Nitroglycerin if Sildenafil was taken within 24 hours (or 48 hours for Tadalafil).'
      }
    ],
    alternatives: [
      { name: 'Imdur', generic_name: 'Isosorbide Mononitrate', safety_rating: 4.1, interaction_risk: 'moderate', price_estimate: '$$', effectiveness_score: 88 }
    ]
  },
  {
    name: 'Sildenafil',
    generic_name: 'Sildenafil',
    drug_class: 'Phosphodiesterase-5 Inhibitor',
    dosages: ['25mg', '50mg', '100mg'],
    warnings: 'Do not take with Nitroglycerin or other nitrates. May cause sudden vision or hearing loss. Priapism (painful erection >4 hours).',
    uses: 'Treatment of erectile dysfunction and pulmonary arterial hypertension.',
    mechanism: 'Inhibits PDE-5, preventing degradation of cGMP in corpus cavernosum and pulmonary vasculature, leading to smooth muscle relaxation and increased blood flow.',
    storage: 'Store at room temperature away from moisture.',
    common_effects: ['Headache', 'Flushing', 'Dyspepsia', 'Nasal congestion', 'Abnormal vision (blue tint)'],
    serious_effects: ['Severe hypotension', 'Non-arteritic anterior ischemic optic neuropathy (NAION)', 'Sudden cardiac death'],
    long_term_effects: ['Generally well tolerated long-term'],
    organ_impact: { brain: 15, heart: 45, liver: 20, kidneys: 20, lungs: 25, stomach: 10 },
    contraindications: ['Heart disease'], // Contraindicated in severe cardiovascular disease, unstable angina, recent MI/stroke
    interactions: [
      {
        with_drug: 'Nitroglycerin',
        severity: 'critical',
        mechanism: 'Synergistic nitric oxide/cGMP pathway vasodilation causing severe hypoperfusion.',
        impact: 'Extreme blood pressure drop, coronary artery hypoperfusion, cardiac arrest.',
        action: 'Never take together. If chest pain occurs after taking Sildenafil, advise medical emergency crew immediately and do not give sublingual nitrates.'
      }
    ],
    alternatives: [
      { name: 'Cialis', generic_name: 'Tadalafil', safety_rating: 4.5, interaction_risk: 'critical', price_estimate: '$$$', effectiveness_score: 93 }
    ]
  },
  {
    name: 'Albuterol',
    generic_name: 'Albuterol',
    drug_class: DRUG_CLASSES.BRONCHODILATOR,
    dosages: ['90mcg inhaler', '2mg', '4mg'],
    warnings: 'Paradoxical bronchospasm. Can cause hypokalemia and palpitations. Use with caution in cardiovascular disorders.',
    uses: 'Prevention and treatment of bronchospasm in patients with reversible obstructive airway disease (Asthma, COPD).',
    mechanism: 'Selectively binds to Beta2-adrenergic receptors in bronchial smooth muscle, activating adenyl cyclase and increasing intracellular cAMP, causing bronchodilation.',
    storage: 'Store inhaler at room temperature. Do not puncture or expose to heat.',
    common_effects: ['Tremor (shaky hands)', 'Nervousness', 'Tachycardia (fast heart rate)', 'Throat irritation'],
    serious_effects: ['Paradoxical bronchospasm', 'Severe tachycardia/arrhythmias', 'Hypokalemia crisis'],
    long_term_effects: ['Beta-receptor down-regulation (decreased response with overuse)'],
    organ_impact: { brain: 15, heart: 35, liver: 10, kidneys: 15, lungs: 85, stomach: 5 },
    contraindications: [], // Safe in asthma (it is the treatment!)
    interactions: [
      {
        with_drug: 'Propranolol',
        severity: 'high',
        mechanism: 'Beta-blockers (like Propranolol) directly antagonize Beta2-stimulant bronchodilation, while Albuterol reduces beta-blocker efficacy.',
        impact: 'Severe bronchospasm in asthmatics, loss of blood pressure/heart rate control.',
        action: 'Avoid non-selective beta-blockers in asthma patients. If a beta-blocker is mandatory, use cardioslective ones (e.g., Metoprolol) with extreme caution.'
      }
    ],
    alternatives: [
      { name: 'Xopenex', generic_name: 'Levalbuterol', safety_rating: 4.8, interaction_risk: 'moderate', price_estimate: '$$$', effectiveness_score: 94 },
      { name: 'Spiriva', generic_name: 'Tiotropium', safety_rating: 4.5, interaction_risk: 'low', price_estimate: '$$$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Propranolol',
    generic_name: 'Propranolol',
    drug_class: DRUG_CLASSES.BETA_BLOCKER,
    dosages: ['10mg', '20mg', '40mg', '80mg'],
    warnings: 'Do not discontinue abruptly (can trigger severe thyroid storm, arrhythmia, or MI). Contraindicated in asthma and severe bronchospastic diseases.',
    uses: 'Management of hypertension, angina pectoris, cardiac arrhythmias, hypertrophic subaortic stenosis, pheochromocytoma, and migraine prophylaxis.',
    mechanism: 'Non-selective beta-adrenergic receptor blocker (blocks both Beta1 and Beta2 receptors), reducing heart rate, cardiac output, and blood pressure, and causing bronchiolar constriction.',
    storage: 'Store in a cool, dark place.',
    common_effects: ['Fatigue', 'Cold extremities', 'Sleep disturbances/nightmares', 'Bradycardia', 'Dizziness'],
    serious_effects: ['Severe bronchospasm', 'Bradyarrhythmias/heart block', 'Masking of hypoglycemia in diabetics', 'Depression'],
    long_term_effects: ['Decreased exercise tolerance', 'Psoriasis flare-ups'],
    organ_impact: { brain: 30, heart: 75, liver: 35, kidneys: 25, lungs: 65, stomach: 15 },
    contraindications: ['Asthma', 'Heart disease'], // Contraindicated in Asthma, bradycardia, cardiogenic shock, heart block
    interactions: [
      {
        with_drug: 'Albuterol',
        severity: 'high',
        mechanism: 'Direct pharmacodynamic antagonism at Beta2-adrenergic receptors.',
        impact: 'Acute bronchospasm and rescue inhaler failure.',
        action: 'Avoid combination. Use cardioselective beta blockers (Metoprolol) or different antihypertensive classes.'
      }
    ],
    alternatives: [
      { name: 'Lopressor', generic_name: 'Metoprolol', safety_rating: 4.4, interaction_risk: 'moderate', price_estimate: '$', effectiveness_score: 91 },
      { name: 'Norvasc', generic_name: 'Amlodipine', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 94 }
    ]
  },
  {
    name: 'Eliquis',
    generic_name: 'Apixaban',
    drug_class: DRUG_CLASSES.ANTICOAGULANT,
    dosages: ['2.5mg', '5mg'],
    warnings: 'Bleeding risk. Do not stop abruptly without consulting doctor. Avoid taking with NSAIDs or Aspirin.',
    uses: 'Reduction of risk of stroke and systemic embolism in non-valvular atrial fibrillation.',
    mechanism: 'Selective, reversible active-site inhibitor of Factor Xa, inhibiting free and clot-bound factor Xa.',
    storage: 'Store at room temperature.',
    common_effects: ['Minor bleeding', 'Easy bruising', 'Nausea'],
    serious_effects: ['Severe hemorrhage', 'Fainting', 'Hypotension'],
    long_term_effects: ['No major cumulative long-term toxicity. Minor hepatic impact.'],
    organ_impact: { brain: 20, heart: 15, liver: 30, kidneys: 35, lungs: 5, stomach: 35 },
    contraindications: ['Pregnancy', 'Active bleeding', 'Severe liver disease'],
    interactions: [
      {
        with_drug: 'Aspirin',
        severity: 'high',
        mechanism: 'Synergistic antiplatelet and anticoagulant effects.',
        impact: 'Increased risk of serious bleeding.',
        action: 'Use with caution. Avoid daily Aspirin unless clinically indicated.'
      },
      {
        with_drug: 'Ibuprofen',
        severity: 'high',
        mechanism: 'NSAID-induced platelet inhibition added to factor Xa inhibition.',
        impact: 'Severe gastrointestinal bleeding risk.',
        action: 'Avoid co-prescription. Use Acetaminophen for pain relief.'
      }
    ],
    alternatives: [
      { name: 'Warfarin', generic_name: 'Warfarin', safety_rating: 4.0, interaction_risk: 'high', price_estimate: '$', effectiveness_score: 92 },
      { name: 'Xarelto', generic_name: 'Rivaroxaban', safety_rating: 4.5, interaction_risk: 'moderate', price_estimate: '$$$', effectiveness_score: 94 }
    ]
  },
  {
    name: 'Xarelto',
    generic_name: 'Rivaroxaban',
    drug_class: DRUG_CLASSES.ANTICOAGULANT,
    dosages: ['10mg', '15mg', '20mg'],
    warnings: 'Bleeding risk. Avoid with other anticoagulants, Aspirin, or NSAIDs.',
    uses: 'Treatment and prevention of deep vein thrombosis and pulmonary embolism.',
    mechanism: 'Reversible, direct inhibitor of Factor Xa, blocking the clotting cascade.',
    storage: 'Store at controlled room temperature.',
    common_effects: ['Bruising', 'Fatigue', 'Dizziness', 'Muscle pain'],
    serious_effects: ['Severe internal bleeding', 'Epidural hematoma risk'],
    long_term_effects: ['Risk of chronic bleeding events in predisposed patients.'],
    organ_impact: { brain: 20, heart: 15, liver: 35, kidneys: 40, lungs: 5, stomach: 40 },
    contraindications: ['Pregnancy', 'Active major bleeding', 'Severe renal impairment'],
    interactions: [
      {
        with_drug: 'Aspirin',
        severity: 'high',
        mechanism: 'Antiplatelet and factor Xa inhibition overlap.',
        impact: 'Elevated gastrointestinal bleeding risk.',
        action: 'Avoid NSAIDs/Aspirin.'
      },
      {
        with_drug: 'Ibuprofen',
        severity: 'high',
        mechanism: 'Pharmacodynamic synergy of NSAID mucosal irritation and factor Xa blockade.',
        impact: 'Extreme risk of stomach ulcer bleeding.',
        action: 'Contraindicated. Switch to Acetaminophen.'
      }
    ],
    alternatives: [
      { name: 'Eliquis', generic_name: 'Apixaban', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$$$', effectiveness_score: 95 }
    ]
  },
  {
    name: 'Tylenol',
    generic_name: 'Paracetamol',
    drug_class: 'Analgesic & Antipyretic',
    dosages: ['325mg', '500mg', '650mg'],
    warnings: 'Severe hepatotoxicity if max dose (4g/day) exceeded. Avoid alcohol while taking. Check other medications for acetaminophen content.',
    uses: 'Temporary relief of minor aches and pains and reduction of fever.',
    mechanism: 'Inhibits prostaglandin synthesis in the central nervous system; weak peripheral COX inhibition.',
    storage: 'Store at room temperature.',
    common_effects: ['Nausea', 'Headache', 'Insomnia'],
    serious_effects: ['Acute liver failure', 'Stevens-Johnson syndrome', 'Anaphylaxis'],
    long_term_effects: ['Chronic daily use can cause chronic liver load or analgesic-induced nephropathy.'],
    organ_impact: { brain: 10, heart: 10, liver: 80, kidneys: 30, lungs: 5, stomach: 15 },
    contraindications: ['Severe liver disease', 'Chronic alcoholism'],
    interactions: [
      {
        with_drug: 'Warfarin',
        severity: 'moderate',
        mechanism: 'Chronic high doses of Acetaminophen may inhibit Warfarin metabolism.',
        impact: 'Slightly elevated INR and bleeding risk if taken daily over 7 days.',
        action: 'Limit usage. Monitor INR regularly if daily dosage exceeds 2g.'
      }
    ],
    alternatives: [
      { name: 'Ibuprofen', generic_name: 'Ibuprofen', safety_rating: 4.2, interaction_risk: 'moderate', price_estimate: '$', effectiveness_score: 88 }
    ]
  },
  {
    name: 'Celebrex',
    generic_name: 'Celecoxib',
    drug_class: DRUG_CLASSES.NSAID,
    dosages: ['100mg', '200mg'],
    warnings: 'Increased risk of serious cardiovascular events. Gastrointestinal bleeding risk (lower than non-selective NSAIDs).',
    uses: 'Relief of symptoms of osteoarthritis and rheumatoid arthritis.',
    mechanism: 'Selective inhibitor of cyclooxygenase-2 (COX-2) enzyme, sparing COX-1 (gastric mucosal protector).',
    storage: 'Store in a dry place at room temperature.',
    common_effects: ['Indigestion', 'Diarrhea', 'Flatulence', 'Peripheral edema'],
    serious_effects: ['Myocardial infarction', 'Stroke', 'Gastrointestinal bleeding'],
    long_term_effects: ['Renal papillary necrosis with chronic use, elevated cardiovascular risk.'],
    organ_impact: { brain: 10, heart: 50, liver: 25, kidneys: 50, lungs: 10, stomach: 35 },
    contraindications: ['Heart disease', 'Sulfa allergy', 'Kidney disease', 'Pregnancy'],
    interactions: [
      {
        with_drug: 'Warfarin',
        severity: 'high',
        mechanism: 'Synergistic bleeding risk and CYP2C9 metabolic overlap.',
        impact: 'Elevated INR and bleeding risk.',
        action: 'Monitor INR daily.'
      }
    ],
    alternatives: [
      { name: 'Tylenol', generic_name: 'Paracetamol', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 87 }
    ]
  },
  {
    name: 'Mobic',
    generic_name: 'Meloxicam',
    drug_class: DRUG_CLASSES.NSAID,
    dosages: ['7.5mg', '15mg'],
    warnings: 'Cardiovascular thrombotic risk. Gastrointestinal irritation and bleeding.',
    uses: 'Relief of osteoarthritis and rheumatoid arthritis pain.',
    mechanism: 'Nonsteroidal anti-inflammatory drug that inhibits COX-1 and COX-2 enzymes.',
    storage: 'Store at room temperature.',
    common_effects: ['Abdominal pain', 'Diarrhea', 'Nausea', 'Dizziness'],
    serious_effects: ['Gastrointestinal perforation', 'Acute kidney injury', 'MI/Stroke'],
    long_term_effects: ['Kidney damage, gastric erosion, blood pressure elevation.'],
    organ_impact: { brain: 10, heart: 40, liver: 25, kidneys: 55, lungs: 10, stomach: 70 },
    contraindications: ['Asthma', 'Kidney disease', 'Liver disease', 'Pregnancy'],
    interactions: [
      {
        with_drug: 'Warfarin',
        severity: 'critical',
        mechanism: 'Additive antiplatelet effect and gastric irritation.',
        impact: 'Gastrointestinal bleeding.',
        action: 'Do not combine. Switch to Tylenol.'
      }
    ],
    alternatives: [
      { name: 'Tylenol', generic_name: 'Paracetamol', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 85 }
    ]
  },
  {
    name: 'Zithromax',
    generic_name: 'Azithromycin',
    drug_class: DRUG_CLASSES.ANTIBIOTIC_MACROLIDE,
    dosages: ['250mg', '500mg'],
    warnings: 'Can cause QT prolongation and cardiac arrhythmia. Risk of hepatotoxicity.',
    uses: 'Treatment of mild to moderate bacterial infections like bronchitis, pneumonia, and skin infections.',
    mechanism: 'Binds to the 50S ribosomal subunit of susceptible microorganisms, interfering with microbial protein synthesis.',
    storage: 'Store at room temperature in a tight container.',
    common_effects: ['Diarrhea', 'Nausea', 'Abdominal pain', 'Vomiting'],
    serious_effects: ['QT interval prolongation', 'Cholestatic jaundice', 'Anaphylaxis'],
    long_term_effects: ['Gut flora disruption. High resistance risk if overused.'],
    organ_impact: { brain: 5, heart: 35, liver: 40, kidneys: 20, lungs: 10, stomach: 35 },
    contraindications: ['Liver disease', 'Heart disease'],
    interactions: [],
    alternatives: [
      { name: 'Amoxicillin', generic_name: 'Amoxicillin', safety_rating: 4.5, interaction_risk: 'moderate', price_estimate: '$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Keflex',
    generic_name: 'Cephalexin',
    drug_class: 'Cephalosporin Antibiotic',
    dosages: ['250mg', '500mg'],
    warnings: 'Contraindicated in patients with cephalosporin allergy. Use with caution in penicillin-allergic patients (10% cross-reactivity).',
    uses: 'Treatment of respiratory tract infections, otitis media, skin and urinary tract infections.',
    mechanism: 'First-generation cephalosporin that inhibits bacterial cell wall synthesis.',
    storage: 'Store at room temperature.',
    common_effects: ['Diarrhea', 'Dyspepsia', 'Gastritis', 'Skin rash'],
    serious_effects: ['Pseudomembranous colitis', 'Anaphylaxis', 'Stevens-Johnson syndrome'],
    long_term_effects: ['Renal loading if used long-term at high doses. Gut microflora depletion.'],
    organ_impact: { brain: 5, heart: 5, liver: 15, kidneys: 45, lungs: 5, stomach: 30 },
    contraindications: ['Allergies'],
    interactions: [],
    alternatives: [
      { name: 'Zithromax', generic_name: 'Azithromycin', safety_rating: 4.6, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 91 }
    ]
  },
  {
    name: 'Cozaar',
    generic_name: 'Losartan',
    drug_class: 'Angiotensin II Receptor Blocker (ARB)',
    dosages: ['25mg', '50mg', '100mg'],
    warnings: 'Fetal toxicity during pregnancy. Risk of hyperkalemia. Renal function impairment in vulnerable patients.',
    uses: 'Treatment of hypertension and protection of kidneys in diabetic patients.',
    mechanism: 'Blocks the vasoconstrictor and aldosterone-secreting effects of angiotensin II by selectively blocking AT1 receptors.',
    storage: 'Store at room temperature in a tight container.',
    common_effects: ['Dizziness', 'Fatigue', 'Nasal congestion', 'Back pain'],
    serious_effects: ['Angioedema (rare)', 'Severe hyperkalemia', 'Renal failure'],
    long_term_effects: ['Excellent long-term safety profile. Kidney protective in diabetes.'],
    organ_impact: { brain: 10, heart: 15, liver: 15, kidneys: 35, lungs: 10, stomach: 15 },
    contraindications: ['Pregnancy', 'Kidney disease'],
    interactions: [
      {
        with_drug: 'Ibuprofen',
        severity: 'high',
        mechanism: 'NSAID decreases renal blood flow, reducing ARB efficacy.',
        impact: 'Reduced blood pressure control and risk of renal failure.',
        action: 'Avoid NSAIDs, monitor renal parameters.'
      }
    ],
    alternatives: [
      { name: 'Norvasc', generic_name: 'Amlodipine', safety_rating: 4.5, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Norvasc',
    generic_name: 'Amlodipine',
    drug_class: DRUG_CLASSES.CALCIUM_CHANNEL_BLOCKER,
    dosages: ['2.5mg', '5mg', '10mg'],
    warnings: 'May cause peripheral edema (swelling of ankles). Risk of hypotension and worsening angina at initiation.',
    uses: 'Treatment of hypertension and chronic stable angina.',
    mechanism: 'Dihydropyridine calcium channel blocker that inhibits calcium influx into vascular smooth muscle, causing vasodilation.',
    storage: 'Store at room temperature away from light.',
    common_effects: ['Peripheral edema', 'Headache', 'Flushing', 'Palpitations'],
    serious_effects: ['Severe hypotension', 'Worsening angina/myocardial infarction'],
    long_term_effects: ['Chronic mild edema, well tolerated over years.'],
    organ_impact: { brain: 10, heart: 35, liver: 20, kidneys: 20, lungs: 10, stomach: 15 },
    contraindications: ['Heart disease'],
    interactions: [],
    alternatives: [
      { name: 'Cozaar', generic_name: 'Losartan', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 93 }
    ]
  },
  {
    name: 'Jardiance',
    generic_name: 'Empagliflozin',
    drug_class: 'SGLT2 Inhibitor (Oral Antidiabetic)',
    dosages: ['10mg', '25mg'],
    warnings: 'Risk of necrotizing fasciitis of the perineum (Fournier\'s gangrene). Risk of ketoacidosis and urinary tract infections.',
    uses: 'Glycemic control in type 2 diabetes and reduction of cardiovascular death risk.',
    mechanism: 'Inhibits sodium-glucose co-transporter 2 (SGLT2) in kidneys, reducing renal glucose reabsorption and increasing urinary glucose excretion.',
    storage: 'Store at room temperature.',
    common_effects: ['Urinary tract infections', 'Yeast infections', 'Increased urination'],
    serious_effects: ['Diabetic ketoacidosis', 'Urosepsis', 'Dehydration/hypotension'],
    long_term_effects: ['Cardioprotective and kidney protective properties in diabetes.'],
    organ_impact: { brain: 5, heart: 10, liver: 15, kidneys: 45, lungs: 5, stomach: 15 },
    contraindications: ['Kidney disease'],
    interactions: [],
    alternatives: [
      { name: 'Metformin', generic_name: 'Metformin', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 92 }
    ]
  },
  {
    name: 'Januvia',
    generic_name: 'Sitagliptin',
    drug_class: 'DPP-4 Inhibitor (Oral Antidiabetic)',
    dosages: ['25mg', '50mg', '100mg'],
    warnings: 'Risk of acute pancreatitis. Severe and disabling joint pain. Worsening heart failure.',
    uses: 'Glycemic control in type 2 diabetes.',
    mechanism: 'Inhibits dipeptidyl peptidase-4 (DPP-4) enzyme, increasing active incretin hormone levels to stimulate insulin release.',
    storage: 'Store at room temperature.',
    common_effects: ['Upper respiratory tract infection', 'Headache', 'Nasopharyngitis'],
    serious_effects: ['Acute pancreatitis', 'Hypersensitivity reactions', 'Severe arthralgia'],
    long_term_effects: ['Generally safe, no chronic organ accumulation.'],
    organ_impact: { brain: 10, heart: 20, liver: 20, kidneys: 45, lungs: 5, stomach: 20 },
    contraindications: ['Kidney disease'],
    interactions: [],
    alternatives: [
      { name: 'Metformin', generic_name: 'Metformin', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Imdur',
    generic_name: 'Isosorbide Mononitrate',
    drug_class: DRUG_CLASSES.NITRATE,
    dosages: ['30mg', '60mg', '120mg'],
    warnings: 'Can cause severe hypotension and headache. Do not use with PDE-5 inhibitors like Sildenafil or Cialis.',
    uses: 'Prevention of angina pectoris due to coronary artery disease.',
    mechanism: 'Relaxes vascular smooth muscle, producing dilatory effects on peripheral arteries and veins.',
    storage: 'Store at controlled room temperature.',
    common_effects: ['Headache', 'Dizziness', 'Flushing', 'Orthostatic hypotension'],
    serious_effects: ['Severe syncope', 'Arrhythmia exacerbation'],
    long_term_effects: ['Development of nitrate tolerance (mitigated by nitrate-free interval).'],
    organ_impact: { brain: 20, heart: 35, liver: 20, kidneys: 25, lungs: 10, stomach: 15 },
    contraindications: ['Heart disease', 'Hypertension'],
    interactions: [
      {
        with_drug: 'Sildenafil',
        severity: 'critical',
        mechanism: 'Synergistic cGMP-mediated vasodilation.',
        impact: 'Severe hypotension collapse.',
        action: 'Never combine.'
      },
      {
        with_drug: 'Cialis',
        severity: 'critical',
        mechanism: 'Synergistic cGMP-mediated vasodilation.',
        impact: 'Severe hypotension collapse.',
        action: 'Never combine.'
      }
    ],
    alternatives: [
      { name: 'Nitroglycerin', generic_name: 'Nitroglycerin', safety_rating: 4.5, interaction_risk: 'critical', price_estimate: '$$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Cialis',
    generic_name: 'Tadalafil',
    drug_class: 'Phosphodiesterase-5 Inhibitor',
    dosages: ['2.5mg', '5mg', '10mg', '20mg'],
    warnings: 'Do not take with Nitroglycerin or other nitrates. Worsens hypotension. Priapism risk. Sudden hearing/vision loss.',
    uses: 'Treatment of erectile dysfunction and benign prostatic hyperplasia.',
    mechanism: 'Inhibits PDE-5, preventing degradation of cGMP, causing smooth muscle relaxation and blood flow.',
    storage: 'Store at room temperature.',
    common_effects: ['Headache', 'Dyspepsia', 'Back pain', 'Myalgia', 'Nasal congestion'],
    serious_effects: ['Severe hypotension collapse', 'NAION (vision loss)', 'Sudden cardiac death'],
    long_term_effects: ['Well tolerated. Tadalafil has a longer half-life (36 hours) than Sildenafil.'],
    organ_impact: { brain: 15, heart: 40, liver: 25, kidneys: 25, lungs: 20, stomach: 15 },
    contraindications: ['Heart disease'],
    interactions: [
      {
        with_drug: 'Nitroglycerin',
        severity: 'critical',
        mechanism: 'Synergistic vasodilation.',
        impact: 'Life-threatening hypotension.',
        action: 'Absolutely contraindicated.'
      },
      {
        with_drug: 'Imdur',
        severity: 'critical',
        mechanism: 'Synergistic vasodilation.',
        impact: 'Life-threatening hypotension.',
        action: 'Absolutely contraindicated.'
      }
    ],
    alternatives: [
      { name: 'Sildenafil', generic_name: 'Sildenafil', safety_rating: 4.2, interaction_risk: 'critical', price_estimate: '$$', effectiveness_score: 91 }
    ]
  },
  {
    name: 'Xopenex',
    generic_name: 'Levalbuterol',
    drug_class: DRUG_CLASSES.BRONCHODILATOR,
    dosages: ['45mcg inhaler', '0.31mg nebulizer', '0.63mg nebulizer'],
    warnings: 'Paradoxical bronchospasm. Cardiovascular stimulation. Risk of hypokalemia.',
    uses: 'Treatment or prevention of bronchospasm in adults and children with reversible obstructive airway disease.',
    mechanism: 'R-enantiomer of albuterol, acting as a selective beta2-adrenergic receptor agonist causing bronchodilation.',
    storage: 'Store at room temperature away from heat.',
    common_effects: ['Tremor', 'Nervousness', 'Palpitations', 'Dizziness'],
    serious_effects: ['Paradoxical bronchospasm', 'Severe tachycardia', 'Arrhythmias'],
    long_term_effects: ['Tachyphylaxis (decreased response) if used excessively.'],
    organ_impact: { brain: 15, heart: 30, liver: 10, kidneys: 15, lungs: 85, stomach: 5 },
    contraindications: [],
    interactions: [
      {
        with_drug: 'Propranolol',
        severity: 'high',
        mechanism: 'Beta blockers directly oppose beta2 bronchodilators.',
        impact: 'Bronchospasm risk.',
        action: 'Avoid combination.'
      }
    ],
    alternatives: [
      { name: 'Albuterol', generic_name: 'Albuterol', safety_rating: 4.7, interaction_risk: 'high', price_estimate: '$', effectiveness_score: 93 }
    ]
  },
  {
    name: 'Spiriva',
    generic_name: 'Tiotropium',
    drug_class: 'Anticholinergic (Bronchodilator)',
    dosages: ['18mcg capsules for inhalation'],
    warnings: 'Not for acute bronchospasm. Can cause dry mouth, glaucoma worsening, or urinary retention.',
    uses: 'Maintenance treatment of bronchospasm associated with COPD and asthma.',
    mechanism: 'Long-acting, muscarinic receptor antagonist (anticholinergic) that inhibits M3 receptors in airway smooth muscle.',
    storage: 'Store capsules in original blister card at room temperature.',
    common_effects: ['Dry mouth', 'Sore throat', 'Sinusitis', 'Constipation'],
    serious_effects: ['Acute angle-closure glaucoma', 'Urinary retention crisis', 'Anaphylaxis'],
    long_term_effects: ['Generally safe. Risk of mild systemic anticholinergic effects.'],
    organ_impact: { brain: 15, heart: 20, liver: 10, kidneys: 35, lungs: 80, stomach: 15 },
    contraindications: [],
    interactions: [],
    alternatives: [
      { name: 'Albuterol', generic_name: 'Albuterol', safety_rating: 4.5, interaction_risk: 'high', price_estimate: '$', effectiveness_score: 88 }
    ]
  },
  {
    name: 'Lopressor',
    generic_name: 'Metoprolol',
    drug_class: DRUG_CLASSES.BETA_BLOCKER,
    dosages: ['25mg', '50mg', '100mg'],
    warnings: 'Do not stop abruptly. Cardioselective but can still trigger bronchospasm in high doses. Monitor heart rate.',
    uses: 'Treatment of hypertension, angina, and hemodynamically stable heart failure.',
    mechanism: 'Beta1-selective (cardioselective) adrenoceptor blocking agent, reducing cardiac output and heart rate.',
    storage: 'Store at room temperature protected from moisture.',
    common_effects: ['Fatigue', 'Dizziness', 'Bradycardia', 'Diarrhea'],
    serious_effects: ['Heart block', 'Severe bradycardia', 'Bronchospasm', 'Cardiac failure worsening'],
    long_term_effects: ['Reduced exercise tolerance, bradyarrhythmias.'],
    organ_impact: { brain: 25, heart: 75, liver: 30, kidneys: 25, lungs: 40, stomach: 15 },
    contraindications: ['Heart disease'],
    interactions: [
      {
        with_drug: 'Albuterol',
        severity: 'moderate',
        mechanism: 'Cardioselective block minimizes but does not eliminate antagonism of beta2 bronchodilation.',
        impact: 'Reduced bronchodilator efficacy.',
        action: 'Use with caution. Monitor respiratory status.'
      }
    ],
    alternatives: [
      { name: 'Norvasc', generic_name: 'Amlodipine', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 93 }
    ]
  },
  {
    name: 'Lipitor',
    generic_name: 'Atorvastatin',
    drug_class: DRUG_CLASSES.STATIN,
    dosages: ['10mg', '20mg', '40mg', '80mg'],
    warnings: 'Risk of rhabdomyolysis (muscle breakdown). Worsens liver enzymes. Avoid grapefruit juice.',
    uses: 'Reduction of elevated total cholesterol, LDL-C, and triglycerides.',
    mechanism: 'Inhibits HMG-CoA reductase, the rate-limiting enzyme in cholesterol synthesis.',
    storage: 'Store at room temperature.',
    common_effects: ['Joint pain', 'Diarrhea', 'Nasopharyngitis', 'Muscle aches'],
    serious_effects: ['Rhabdomyolysis', 'Hepatotoxicity', 'Myopathy'],
    long_term_effects: ['Elevated risk of new-onset diabetes, chronic liver enzyme elevation.'],
    organ_impact: { brain: 10, heart: 15, liver: 70, kidneys: 25, lungs: 5, stomach: 20 },
    contraindications: ['Liver disease', 'Pregnancy'],
    interactions: [],
    alternatives: [
      { name: 'Crestor', generic_name: 'Rosuvastatin', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 95 }
    ]
  },
  {
    name: 'Synthroid',
    generic_name: 'Levothyroxine',
    drug_class: 'Thyroid Hormone',
    dosages: ['25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg'],
    warnings: 'Do not use for weight loss. Risk of cardiac arrhythmias at high doses. Take on empty stomach.',
    uses: 'Replacement therapy in primary, secondary, and tertiary hypothyroidism.',
    mechanism: 'Synthetically replaces endogenous T4 thyroid hormone, which is converted to active T3 in tissue.',
    storage: 'Store protected from light and moisture.',
    common_effects: ['Weight loss', 'Heat intolerance', 'Tremors', 'Nervousness'],
    serious_effects: ['Tachycardia', 'Atrial fibrillation', 'Angina pectoris'],
    long_term_effects: ['Bone mineral density loss (osteoporosis risk) with over-replacement.'],
    organ_impact: { brain: 20, heart: 50, liver: 15, kidneys: 15, lungs: 5, stomach: 10 },
    contraindications: ['Uncorrected adrenal insufficiency', 'Acute myocardial infarction'],
    interactions: [],
    alternatives: []
  },
  {
    name: 'Nexium',
    generic_name: 'Esomeprazole',
    drug_class: DRUG_CLASSES.PROTON_PUMP_INHIBITOR,
    dosages: ['20mg', '40mg'],
    warnings: 'Risk of bone fractures, hypomagnesemia, and C. difficile diarrhea with long term use.',
    uses: 'Treatment of GERD, healing of erosive esophagitis, and H. pylori eradication.',
    mechanism: 'Suppresses gastric acid secretion by specific inhibition of the H+/K+-ATPase proton pump.',
    storage: 'Store in a tight container at room temperature.',
    common_effects: ['Headache', 'Diarrhea', 'Nausea', 'Flatulence', 'Dry mouth'],
    serious_effects: ['C. difficile diarrhea', 'Interstitial nephritis', 'Hypomagnesemia'],
    long_term_effects: ['Osteoporosis, vitamin B12 malabsorption, chronic kidney load.'],
    organ_impact: { brain: 10, heart: 10, liver: 25, kidneys: 35, lungs: 5, stomach: 65 },
    contraindications: [],
    interactions: [],
    alternatives: [
      { name: 'Prilosec', generic_name: 'Omeprazole', safety_rating: 4.6, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 91 }
    ]
  },
  {
    name: 'Prilosec',
    generic_name: 'Omeprazole',
    drug_class: DRUG_CLASSES.PROTON_PUMP_INHIBITOR,
    dosages: ['10mg', '20mg', '40mg'],
    warnings: 'Long term use increases risk of bone fractures and kidney damage.',
    uses: 'Short-term treatment of active duodenal ulcer, GERD, and erosive esophagitis.',
    mechanism: 'Irreversibly binds to proton pump enzymes in gastric parietal cells, blocking gastric acid secretion.',
    storage: 'Store at room temperature in a dry place.',
    common_effects: ['Abdominal pain', 'Nausea', 'Vomiting', 'Headache'],
    serious_effects: ['Acute kidney injury', 'Severe cutaneous adverse reactions'],
    long_term_effects: ['B12 deficiency, bone density loss, dementia risk (disputed).'],
    organ_impact: { brain: 10, heart: 10, liver: 25, kidneys: 40, lungs: 5, stomach: 60 },
    contraindications: [],
    interactions: [],
    alternatives: [
      { name: 'Nexium', generic_name: 'Esomeprazole', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 93 }
    ]
  },
  {
    name: 'Singulair',
    generic_name: 'Montelukast',
    drug_class: 'Leukotriene Receptor Antagonist',
    dosages: ['4mg', '5mg', '10mg'],
    warnings: 'Black box warning for serious neuropsychiatric events (aggression, depression, suicidal thoughts).',
    uses: 'Prophylaxis and chronic treatment of asthma; relief of allergic rhinitis symptoms.',
    mechanism: 'Selectively binds to cysteinyl leukotriene CysLT1 receptors, blocking airway inflammation and constriction.',
    storage: 'Store at room temperature away from moisture.',
    common_effects: ['Headache', 'Fever', 'Cough', 'Abdominal pain'],
    serious_effects: ['Neuropsychiatric changes', 'Churg-Strauss syndrome', 'Thrombocytopenia'],
    long_term_effects: ['Generally safe, no chronic organ burden.'],
    organ_impact: { brain: 35, heart: 10, liver: 20, kidneys: 15, lungs: 50, stomach: 10 },
    contraindications: [],
    interactions: [],
    alternatives: []
  },
  {
    name: 'Xanax',
    generic_name: 'Alprazolam',
    drug_class: 'Benzodiazepine Anxiolytic',
    dosages: ['0.25mg', '0.5mg', '1mg', '2mg'],
    warnings: 'High risk of abuse, dependence, and addiction. May cause severe central nervous system depression. Avoid alcohol.',
    uses: 'Management of anxiety disorders and short-term relief of panic disorder.',
    mechanism: 'Enhances the inhibitory neurotransmitter gamma-aminobutyric acid (GABA) via direct receptor binding.',
    storage: 'Store at room temperature in a secure location.',
    common_effects: ['Sedation', 'Drowsiness', 'Slurred speech', 'Memory impairment'],
    serious_effects: ['Respiratory depression', 'Dependency/Withdrawal seizures', 'Coma'],
    long_term_effects: ['Cognitive decline with decades of use, high psychological tolerance.'],
    organ_impact: { brain: 85, heart: 20, liver: 30, kidneys: 20, lungs: 30, stomach: 10 },
    contraindications: ['Glaucoma', 'Severe respiratory insufficiency'],
    interactions: [],
    alternatives: []
  },
  {
    name: 'Zoloft',
    generic_name: 'Sertraline',
    drug_class: DRUG_CLASSES.SSRI,
    dosages: ['25mg', '50mg', '100mg'],
    warnings: 'Suicidal thoughts warning in children and young adults. Risk of serotonin syndrome. Do not stop abruptly.',
    uses: 'Treatment of major depressive disorder, panic disorder, OCD, PTSD, and social anxiety.',
    mechanism: 'Selectively inhibits presynaptic serotonin reuptake, boosting extracellular serotonin levels.',
    storage: 'Store at controlled room temperature.',
    common_effects: ['Nausea', 'Diarrhea', 'Sexual dysfunction', 'Insomnia', 'Fatigue'],
    serious_effects: ['Serotonin syndrome', 'Hyponatremia', 'QT prolongation'],
    long_term_effects: ['Weight gain, emotional blunting, mild hepatic metabolism adaptation.'],
    organ_impact: { brain: 65, heart: 25, liver: 35, kidneys: 25, lungs: 10, stomach: 30 },
    contraindications: [],
    interactions: [
      {
        with_drug: 'Ultram',
        severity: 'high',
        mechanism: 'Synergistic serotonergic activity (SSRI + Serotonin reuptake inhibitor).',
        impact: 'Serotonin syndrome (shivering, hyperthermia, seizures, death).',
        action: 'Avoid combination. Monitor closely if mandatory. Educate patient on serotonin warning signs.'
      }
    ],
    alternatives: [
      { name: 'Prozac', generic_name: 'Fluoxetine', safety_rating: 4.5, interaction_risk: 'moderate', price_estimate: '$', effectiveness_score: 90 },
      { name: 'Lexapro', generic_name: 'Escitalopram', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 93 }
    ]
  },
  {
    name: 'Prozac',
    generic_name: 'Fluoxetine',
    drug_class: DRUG_CLASSES.SSRI,
    dosages: ['10mg', '20mg', '40mg'],
    warnings: 'Suicide risk. Long half-life (requires 5-week washout before MAOIs). Serotonin syndrome risk.',
    uses: 'Acute and maintenance treatment of major depressive disorder and OCD.',
    mechanism: 'Highly selective inhibitor of neuronal serotonin reuptake in the brain.',
    storage: 'Store in a cool, dark place.',
    common_effects: ['Anxiety', 'Nervousness', 'Decreased libido', 'Anorexia'],
    serious_effects: ['Serotonin toxicity', 'Severe hyponatremia', 'Bleeding activation'],
    long_term_effects: ['Maintains stable brain chemistry changes over years. Mild liver workload.'],
    organ_impact: { brain: 70, heart: 25, liver: 40, kidneys: 25, lungs: 10, stomach: 25 },
    contraindications: [],
    interactions: [
      {
        with_drug: 'Ultram',
        severity: 'high',
        mechanism: 'CYP2D6 inhibition by Prozac prevents conversion of Tramadol to its active analgesic metabolite.',
        impact: 'Loss of pain control and elevated serotonin syndrome risk.',
        action: 'Avoid combination. Switch to different analgesic or non-SSRI antidepressant.'
      }
    ],
    alternatives: [
      { name: 'Zoloft', generic_name: 'Sertraline', safety_rating: 4.6, interaction_risk: 'moderate', price_estimate: '$', effectiveness_score: 91 }
    ]
  },
  {
    name: 'Lexapro',
    generic_name: 'Escitalopram',
    drug_class: DRUG_CLASSES.SSRI,
    dosages: ['5mg', '10mg', '20mg'],
    warnings: 'Suicidal ideation. High risk of QT interval prolongation in susceptible patients.',
    uses: 'Acute and maintenance treatment of major depressive disorder and generalized anxiety.',
    mechanism: 'Pure S-enantiomer of citalopram with highly specific serotonin reuptake inhibition.',
    storage: 'Store at room temperature.',
    common_effects: ['Nausea', 'Ejaculatory delay', 'Increased sweating', 'Somnolence'],
    serious_effects: ['QT prolongation', 'Serotonin syndrome', 'Severe hyponatremia'],
    long_term_effects: ['Highly tolerated long-term. Very clean metabolic profile.'],
    organ_impact: { brain: 60, heart: 30, liver: 30, kidneys: 20, lungs: 10, stomach: 20 },
    contraindications: [],
    interactions: [],
    alternatives: [
      { name: 'Zoloft', generic_name: 'Sertraline', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 94 }
    ]
  },
  {
    name: 'Lasix',
    generic_name: 'Furosemide',
    drug_class: DRUG_CLASSES.DIURETIC_LOOP,
    dosages: ['20mg', '40mg', '80mg'],
    warnings: 'Can lead to profound diuresis with water and electrolyte depletion. Ototoxicity at high doses.',
    uses: 'Treatment of edema associated with congestive heart failure, cirrhosis, and renal disease.',
    mechanism: 'Inhibits sodium and chloride absorption in the ascending limb of the loop of Henle.',
    storage: 'Store at room temperature, protect from light.',
    common_effects: ['Frequent urination', 'Muscle cramps', 'Dizziness', 'Dehydration'],
    serious_effects: ['Hypokalemia crisis', 'Acute kidney injury', 'Ototoxicity (deafness)'],
    long_term_effects: ['Chronic electrolyte instability, progressive kidney stress if over-prescribed.'],
    organ_impact: { brain: 10, heart: 30, liver: 20, kidneys: 75, lungs: 15, stomach: 25 },
    contraindications: ['Anuria', 'Hepatic coma'],
    interactions: [
      {
        with_drug: 'Lisinopril',
        severity: 'moderate',
        mechanism: 'Additive hypotensive effects and transient renal impairment.',
        impact: 'Dizziness, severe hypotension, and elevated creatinine.',
        action: 'Use lower diuretic doses when starting ACE inhibitor.'
      }
    ],
    alternatives: []
  },
  {
    name: 'Microzide',
    generic_name: 'Hydrochlorothiazide',
    drug_class: DRUG_CLASSES.DIURETIC_THIAZIDE,
    dosages: ['12.5mg', '25mg', '50mg'],
    warnings: 'Risk of hypokalemia, hyponatremia, and hypercalcemia. Worsens gout.',
    uses: 'Adjunctive therapy in edema; management of mild to moderate hypertension.',
    mechanism: 'Inhibits sodium reabsorption in the distal convoluted tubules, increasing water excretion.',
    storage: 'Store at room temperature.',
    common_effects: ['Mild orthostatic hypotension', 'Hypokalemia', 'Photosensitivity'],
    serious_effects: ['Severe electrolyte collapse', 'Pancreatitis', 'Cardiac arrhythmia'],
    long_term_effects: ['Increased uric acid (gout triggers), mild glucose intolerance.'],
    organ_impact: { brain: 10, heart: 20, liver: 15, kidneys: 60, lungs: 10, stomach: 20 },
    contraindications: ['Anuria', 'Allergies'],
    interactions: [],
    alternatives: []
  },
  {
    name: 'Aldactone',
    generic_name: 'Spironolactone',
    drug_class: 'Aldosterone Antagonist / Diuretic',
    dosages: ['25mg', '50mg', '100mg'],
    warnings: 'Risk of hyperkalemia. Gynecomastia in male patients. Avoid potassium supplements.',
    uses: 'Management of primary hyperaldosteronism, heart failure, and cirrhosis ascites.',
    mechanism: 'Competitively inhibits aldosterone receptors in distal renal tubules, retaining potassium.',
    storage: 'Store at controlled room temperature.',
    common_effects: ['Gynecomastia', 'Hyperkalemia', 'Headache', 'Menstrual irregularities'],
    serious_effects: ['Severe hyperkalemia (arrhythmia risk)', 'Acute renal failure'],
    long_term_effects: ['Endocrine shifts (anti-androgenic activity). Kidney protective in heart failure.'],
    organ_impact: { brain: 10, heart: 25, liver: 20, kidneys: 55, lungs: 10, stomach: 25 },
    contraindications: ['Anuria', 'Kidney disease', 'Hyperkalemia'],
    interactions: [
      {
        with_drug: 'Lisinopril',
        severity: 'high',
        mechanism: 'Dual inhibition of aldosterone pathway retains excessive potassium.',
        impact: 'Critical hyperkalemia.',
        action: 'Monitor potassium weekly. Keep doses low.'
      }
    ],
    alternatives: []
  },
  {
    name: 'Plavix',
    generic_name: 'Clopidogrel',
    drug_class: 'Antiplatelet Agent',
    dosages: ['75mg', '300mg'],
    warnings: 'Bleeding risk. Reduced efficacy in CYP2C19 poor metabolizers. Avoid taking with Omeprazole.',
    uses: 'Reduction of atherothrombotic events in patients with recent MI, stroke, or PAD.',
    mechanism: 'Irreversibly inhibits ADP binding to platelet receptors, blocking subsequent activation.',
    storage: 'Store at room temperature.',
    common_effects: ['Easy bruising', 'Bleeding', 'Epistaxis (nosebleeds)'],
    serious_effects: ['Thrombotic thrombocytopenic purpura (TTP)', 'Severe GI hemorrhage'],
    long_term_effects: ['Chronic vascular fragility and bleeding risk.'],
    organ_impact: { brain: 20, heart: 25, liver: 30, kidneys: 20, lungs: 10, stomach: 45 },
    contraindications: ['Active pathological bleeding'],
    interactions: [
      {
        with_drug: 'Aspirin',
        severity: 'moderate',
        mechanism: 'Synergistic antiplatelet blockade (often used as DAPT).',
        impact: 'Enhanced cardioprotection but doubled bleeding risk.',
        action: 'Frequently co-prescribed. Monitor for bruising or black stools.'
      },
      {
        with_drug: 'Prilosec',
        severity: 'high',
        mechanism: 'Omeprazole inhibits CYP2C19, preventing conversion of Clopidogrel to active form.',
        impact: 'Reduced antiplatelet efficacy, increasing stroke risk.',
        action: 'Avoid combination. Swap Omeprazole for Pantoprazole or Famotidine.'
      }
    ],
    alternatives: []
  },
  {
    name: 'Bactrim',
    generic_name: 'Sulfamethoxazole/Trimethoprim',
    drug_class: 'Sulfonamide Antibiotic',
    dosages: ['160mg/800mg'],
    warnings: 'Risk of Stevens-Johnson syndrome and toxic epidermal necrolysis. Do not use in patients with sulfa allergy.',
    uses: 'Treatment of urinary tract infections, acute otitis media, and shigellosis.',
    mechanism: 'Dual enzyme blockade of bacterial folic acid synthesis pathways.',
    storage: 'Store at room temperature in a dry place.',
    common_effects: ['Nausea', 'Vomiting', 'Anorexia', 'Skin rash'],
    serious_effects: ['Stevens-Johnson syndrome', 'Aplastic anemia', 'Hyperkalemia'],
    long_term_effects: ['Gut flora disruption. Renal toxicity if dehydrated.'],
    organ_impact: { brain: 10, heart: 10, liver: 35, kidneys: 60, lungs: 10, stomach: 40 },
    contraindications: ['Allergies', 'Liver disease', 'Kidney disease'],
    interactions: [],
    alternatives: []
  },
  {
    name: 'Cipro',
    generic_name: 'Ciprofloxacin',
    drug_class: DRUG_CLASSES.ANTIBIOTIC_FLUOROQUINOLONE,
    dosages: ['250mg', '500mg', '750mg'],
    warnings: 'Black box warning for tendon rupture, peripheral neuropathy, and CNS effects. Risk of aortic aneurysm.',
    uses: 'Treatment of urinary tract infections, prostatitis, and lower respiratory tract infections.',
    mechanism: 'Inhibits bacterial DNA gyrase and topoisomerase IV, blocking replication.',
    storage: 'Store at room temperature. Avoid freezing.',
    common_effects: ['Nausea', 'Diarrhea', 'Headache', 'Photosensitivity'],
    serious_effects: ['Achilles tendon rupture', 'Peripheral neuropathy', 'QT prolongation'],
    long_term_effects: ['Risk of persistent neuromuscular side effects (fluoroquinolone toxicity).'],
    organ_impact: { brain: 35, heart: 30, liver: 30, kidneys: 45, lungs: 10, stomach: 35 },
    contraindications: ['Pregnancy'],
    interactions: [],
    alternatives: []
  },
  {
    name: 'Zofran',
    generic_name: 'Ondansetron',
    drug_class: '5-HT3 Receptor Antagonist (Antiemetic)',
    dosages: ['4mg', '8mg'],
    warnings: 'Can cause dose-dependent QT interval prolongation. Worsens constipation.',
    uses: 'Prevention of nausea and vomiting associated with cancer chemotherapy and surgery.',
    mechanism: 'Selective 5-HT3 serotonin receptor antagonist in central and peripheral nerves.',
    storage: 'Store at room temperature in dark blister cards.',
    common_effects: ['Headache', 'Constipation', 'Fatigue', 'Drowsiness'],
    serious_effects: ['QT prolongation', 'Serotonin syndrome (if combined with SSRIs)', 'Anaphylaxis'],
    long_term_effects: ['Mild chronic constipation. Very safe profile.'],
    organ_impact: { brain: 30, heart: 35, liver: 30, kidneys: 20, lungs: 5, stomach: 30 },
    contraindications: [],
    interactions: [
      {
        with_drug: 'Zoloft',
        severity: 'moderate',
        mechanism: 'Additive serotonergic effects and QT interval prolongation risks.',
        impact: 'Potential serotonin toxicity or arrhythmia.',
        action: 'Monitor closely. Check ECG if high doses are taken.'
      }
    ],
    alternatives: []
  },
  {
    name: 'Claritin',
    generic_name: 'Loratadine',
    drug_class: DRUG_CLASSES.ANTIHISTAMINE,
    dosages: ['10mg'],
    warnings: 'Generally non-drowsy. Exercise caution in severe liver impairment.',
    uses: 'Relief of nasal and non-nasal symptoms of seasonal allergic rhinitis.',
    mechanism: 'Selective, long-acting peripheral H1-receptor antihistamine.',
    storage: 'Store at room temperature.',
    common_effects: ['Dry mouth', 'Headache', 'Fatigue'],
    serious_effects: ['Anaphylaxis (extremely rare)', 'Arrhythmia at massive overdose'],
    long_term_effects: ['None. High safety ceiling.'],
    organ_impact: { brain: 15, heart: 10, liver: 20, kidneys: 20, lungs: 10, stomach: 10 },
    contraindications: [],
    interactions: [],
    alternatives: [
      { name: 'Zyrtec', generic_name: 'Cetirizine', safety_rating: 4.7, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 92 },
      { name: 'Allegra', generic_name: 'Fexofenadine', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$$', effectiveness_score: 94 }
    ]
  },
  {
    name: 'Zyrtec',
    generic_name: 'Cetirizine',
    drug_class: DRUG_CLASSES.ANTIHISTAMINE,
    dosages: ['5mg', '10mg'],
    warnings: 'May cause mild somnolence (drowsiness) in sensitive individuals. Avoid alcohol.',
    uses: 'Relief of symptoms associated with seasonal and perennial allergic rhinitis.',
    mechanism: 'Highly selective peripheral H1-receptor antagonist with minimal blood-brain barrier crossing.',
    storage: 'Store at room temperature.',
    common_effects: ['Somnolence', 'Dry mouth', 'Fatigue', 'Pharyngitis'],
    serious_effects: ['Severe hypersensitivity'],
    long_term_effects: ['None. Well tolerated.'],
    organ_impact: { brain: 25, heart: 10, liver: 20, kidneys: 25, lungs: 10, stomach: 10 },
    contraindications: [],
    interactions: [],
    alternatives: [
      { name: 'Claritin', generic_name: 'Loratadine', safety_rating: 4.5, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 89 }
    ]
  },
  {
    name: 'Allegra',
    generic_name: 'Fexofenadine',
    drug_class: DRUG_CLASSES.ANTIHISTAMINE,
    dosages: ['60mg', '180mg'],
    warnings: 'Do not take with fruit juices (grapefruit, apple, orange) as they reduce absorption.',
    uses: 'Relief of symptoms of seasonal allergic rhinitis and chronic idiopathic urticaria.',
    mechanism: 'Highly selective, non-sedating peripheral H1-receptor antihistamine.',
    storage: 'Store at room temperature in a dry container.',
    common_effects: ['Headache', 'Dizziness', 'Nausea'],
    serious_effects: ['Allergic swelling'],
    long_term_effects: ['Clean long-term safety profile.'],
    organ_impact: { brain: 10, heart: 10, liver: 15, kidneys: 25, lungs: 10, stomach: 15 },
    contraindications: [],
    interactions: [],
    alternatives: [
      { name: 'Claritin', generic_name: 'Loratadine', safety_rating: 4.5, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 90 }
    ]
  },
  {
    name: 'Flonase',
    generic_name: 'Fluticasone',
    drug_class: 'Nasal Corticosteroid',
    dosages: ['50mcg nasal spray'],
    warnings: 'May cause nasal septal perforation or epistaxis (nosebleeds). Risk of localized Candida infection.',
    uses: 'Management of nasal symptoms of seasonal and perennial allergic rhinitis.',
    mechanism: 'Potent anti-inflammatory corticosteroid acting locally on nasal mucosal receptors.',
    storage: 'Store at room temperature. Do not freeze.',
    common_effects: ['Nasal burning', 'Epistaxis', 'Headache', 'Pharyngitis'],
    serious_effects: ['Nasal septal perforation', 'Glaucoma worsening'],
    long_term_effects: ['Localized mucosal thinning over decades. Insignificant systemic absorption.'],
    organ_impact: { brain: 10, heart: 5, liver: 10, kidneys: 10, lungs: 40, stomach: 5 },
    contraindications: [],
    interactions: [],
    alternatives: []
  },
  {
    name: 'Deltasone',
    generic_name: 'Prednisone',
    drug_class: DRUG_CLASSES.STEROID,
    dosages: ['2.5mg', '5mg', '10mg', '20mg', '50mg'],
    warnings: 'May cause hypothalamic-pituitary-adrenal (HPA) axis suppression. Worsens infections. Can cause mood changes and fluid retention.',
    uses: 'Treatment of severe inflammatory, allergic, and autoimmune diseases.',
    mechanism: 'Systemic glucocorticoid that binds to intracellular receptors, down-regulating inflammatory genes.',
    storage: 'Store at room temperature.',
    common_effects: ['Increased appetite', 'Insomnia', 'Mood swings', 'Fluid retention', 'Hyperglycemia'],
    serious_effects: ['Adrenal crisis on abrupt withdrawal', 'Osteoporosis', 'Aseptic necrosis of bones'],
    long_term_effects: ['Osteoporosis, Cushingoid features (moon face), cataracts, immune suppression.'],
    organ_impact: { brain: 45, heart: 40, liver: 45, kidneys: 45, lungs: 10, stomach: 65 },
    contraindications: ['Systemic fungal infections'],
    interactions: [
      {
        with_drug: 'Ibuprofen',
        severity: 'high',
        mechanism: 'Synergistic gastric mucosal damage pathways.',
        impact: 'Severe risk of GI ulcers and bleeding.',
        action: 'Avoid co-prescription. Provide proton pump inhibitor if mandatory.'
      }
    ],
    alternatives: []
  },
  {
    name: 'Naprosyn',
    generic_name: 'Naproxen',
    drug_class: DRUG_CLASSES.NSAID,
    dosages: ['250mg', '375mg', '500mg'],
    warnings: 'Cardiovascular and gastrointestinal warning. Worsens renal clearance. Fluid retention risk.',
    uses: 'Treatment of rheumatoid arthritis, osteoarthritis, acute gout, and mild pain.',
    mechanism: 'Reversible, non-selective COX-1 and COX-2 inhibitor, preventing prostaglandin synthesis.',
    storage: 'Store in a tight container at room temperature.',
    common_effects: ['Dyspepsia', 'Heartburn', 'Nausea', 'Dizziness'],
    serious_effects: ['GI bleeding', 'Acute kidney injury', 'Myocardial infarction'],
    long_term_effects: ['Chronic gastritis, renal papillary necrosis, blood pressure elevation.'],
    organ_impact: { brain: 10, heart: 35, liver: 25, kidneys: 60, lungs: 10, stomach: 75 },
    contraindications: ['Asthma', 'Kidney disease', 'Liver disease', 'Hypertension', 'Pregnancy'],
    interactions: [
      {
        with_drug: 'Warfarin',
        severity: 'critical',
        mechanism: 'Dual coagulation pathway blockade and gastric mucosa erosion.',
        impact: 'Severe internal bleeding.',
        action: 'Do not combine. Switch to Tylenol.'
      },
      {
        with_drug: 'Lisinopril',
        severity: 'high',
        mechanism: 'Prostaglandin blockade constricts renal blood flow, opposing Lisinopril dilation.',
        impact: 'Acute renal failure and blood pressure spikes.',
        action: 'Monitor GFR and BP closely. Limit NSAID duration.'
      }
    ],
    alternatives: [
      { name: 'Tylenol', generic_name: 'Paracetamol', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 86 }
    ]
  },
  {
    name: 'Voltaren',
    generic_name: 'Diclofenac',
    drug_class: DRUG_CLASSES.NSAID,
    dosages: ['50mg', '75mg'],
    warnings: 'Cardiovascular thrombotic risks. Hepatotoxicity risk (higher than other NSAIDs). Gastrointestinal bleeding.',
    uses: 'Treatment of pain, osteoarthritis, and rheumatoid arthritis.',
    mechanism: 'Non-selective inhibitor of cyclooxygenase enzymes, reducing prostaglandin production.',
    storage: 'Store at controlled room temperature.',
    common_effects: ['Stomach pain', 'Nausea', 'Headache', 'Dizziness'],
    serious_effects: ['Hepatotoxic liver failure', 'GI ulcer perforation', 'Acute renal dysfunction'],
    long_term_effects: ['Elevated transaminases (liver damage), chronic kidney loading, cardiac risk.'],
    organ_impact: { brain: 10, heart: 40, liver: 60, kidneys: 55, lungs: 10, stomach: 70 },
    contraindications: ['Asthma', 'Kidney disease', 'Liver disease', 'Pregnancy', 'Heart disease'],
    interactions: [
      {
        with_drug: 'Warfarin',
        severity: 'critical',
        mechanism: 'Gastric protection disruption + anticoagulation.',
        impact: 'Severe hemorrhage.',
        action: 'Avoid combination.'
      }
    ],
    alternatives: [
      { name: 'Tylenol', generic_name: 'Paracetamol', safety_rating: 4.8, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 87 }
    ]
  },
  {
    name: 'Ultram',
    generic_name: 'Tramadol',
    drug_class: 'Analgesic (Opioid Agonist)',
    dosages: ['50mg', '100mg'],
    warnings: 'Risk of addiction, abuse, and misuse. Respiratory depression. Risk of serotonin syndrome. Lowers seizure threshold.',
    uses: 'Management of moderate to moderately severe pain in adults.',
    mechanism: 'Binds to mu-opioid receptors and weakly inhibits reuptake of norepinephrine and serotonin.',
    storage: 'Store at room temperature in a secure container.',
    common_effects: ['Dizziness', 'Nausea', 'Constipation', 'Somnolence', 'Sweating'],
    serious_effects: ['Serotonin syndrome', 'Seizures', 'Respiratory depression'],
    long_term_effects: ['Physical dependency, chronic constipation, CNS tolerance.'],
    organ_impact: { brain: 75, heart: 25, liver: 35, kidneys: 30, lungs: 30, stomach: 25 },
    contraindications: ['Severe respiratory depression', 'Acute asthma', 'Epilepsy'],
    interactions: [
      {
        with_drug: 'Zoloft',
        severity: 'high',
        mechanism: 'Synergistic serotonergic activity (SSRI + Serotonin reuptake inhibitor).',
        impact: 'Serotonin syndrome (shivering, hyperthermia, seizures, death).',
        action: 'Avoid combination. Monitor closely if mandatory. Educate patient on serotonin warning signs.'
      },
      {
        with_drug: 'Prozac',
        severity: 'high',
        mechanism: 'CYP2D6 inhibition by Prozac prevents conversion of Tramadol to its active analgesic metabolite.',
        impact: 'Loss of pain control and elevated serotonin syndrome risk.',
        action: 'Avoid combination. Switch to different analgesic or non-SSRI antidepressant.'
      }
    ],
    alternatives: [
      { name: 'Tylenol', generic_name: 'Paracetamol', safety_rating: 4.6, interaction_risk: 'low', price_estimate: '$', effectiveness_score: 80 }
    ]
  }
];


// Helper dictionaries for generating 500+ medicines programmatically
const DRUG_PREFIXES = ['Lipo', 'Cardio', 'Amox', 'Nor', 'Pro', 'Met', 'Zithro', 'Kef', 'Zolo', 'Coza', 'Singul', 'Nex', 'Prilo', 'Leva', 'Aten', 'Sertra', 'Gluc', 'Diab', 'Las', 'Vas', 'Vent', 'Symb', 'Flo', 'Alpra', 'Val', 'Xan', 'Clar', 'Zyr', 'Alleg', 'Flon'];
const DRUG_SUFFIXES = ['tor', 'ril', 'in', 'ex', 'ol', 'cor', 'press', 'dipine', 'artan', 'ax', 'cin', 'prazole', 'lone', 'mycin', 'phage', 'izide', 'ide', 'olin', 'cort', 'zine', 'dine', 'ast', 'emide', 'olol'];

const GENERIC_ROOTS = ['atorvastatin', 'lisinopril', 'amoxicillin', 'amlodipine', 'losartan', 'metformin', 'azithromycin', 'cephalexin', 'sertraline', 'omeprazole', 'prednisone', 'levofloxacin', 'atenolol', 'fluoxetine', 'glipizide', 'furosemide', 'albuterol', 'montelukast', 'fluticasone', 'alprazolam', 'valacyclovir', 'cetirizine', 'loratadine', 'fexofenadine', 'pantoprazole', 'simvastatin', 'metoprolol', 'clopidogrel', 'gabapentin', 'trazodone'];

const SAMPLE_PATIENTS = [
  {
    id: 1,
    name: 'John Doe',
    age: 62,
    gender: 'Male',
    weight: '82 kg',
    height: '178 cm',
    blood_group: 'A+',
    allergies: ['Penicillin', 'Sulfa Drugs'],
    existing_conditions: ['Hypertension', 'Diabetes', 'Chronic Kidney Disease']
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    age: 34,
    gender: 'Female',
    weight: '64 kg',
    height: '165 cm',
    blood_group: 'O-',
    allergies: ['Aspirin'],
    existing_conditions: ['Asthma', 'Pregnancy']
  },
  {
    id: 3,
    name: 'David Miller',
    age: 71,
    gender: 'Male',
    weight: '91 kg',
    height: '172 cm',
    blood_group: 'B+',
    allergies: ['None'],
    existing_conditions: ['Heart Disease', 'Hypertension', 'Liver Disease']
  },
  {
    id: 4,
    name: 'Emily Watson',
    age: 28,
    gender: 'Female',
    weight: '58 kg',
    height: '170 cm',
    blood_group: 'AB+',
    allergies: ['Penicillin', 'Peanuts'],
    existing_conditions: ['Asthma']
  },
  {
    id: 5,
    name: 'Robert Chen',
    age: 55,
    gender: 'Male',
    weight: '76 kg',
    height: '175 cm',
    blood_group: 'O+',
    allergies: ['NSAIDs'],
    existing_conditions: ['Diabetes', 'Hypertension']
  }
];

// Seed function
async function seed() {
  await initDb();
  
  const medicines = [];
  let idCounter = 1;

  // 1. Add core drugs first
  CORE_DRUGS.forEach(core => {
    medicines.push({
      id: idCounter++,
      name: core.name,
      generic_name: core.generic_name,
      drug_class: core.drug_class,
      dosages: core.dosages,
      warnings: core.warnings,
      uses: core.uses,
      mechanism: core.mechanism,
      storage: core.storage,
      side_effects: {
        common: core.common_effects,
        serious: core.serious_effects,
        long_term: core.long_term_effects,
        organ_impact: core.organ_impact
      },
      contraindications: core.contraindications,
      interactions: core.interactions,
      alternatives: core.alternatives
    });
  });

  // 1b. Add NHS drugs from nhs_drugs.json
  try {
    const nhsDrugsPath = path.join(__dirname, 'data', 'nhs_drugs.json');
    if (fs.existsSync(nhsDrugsPath)) {
      const nhsRaw = fs.readFileSync(nhsDrugsPath, 'utf8');
      const nhsDrugs = JSON.parse(nhsRaw);
      nhsDrugs.forEach(drug => {
        medicines.push({
          id: idCounter++,
          ...drug
        });
      });
      console.log(`Loaded and queued ${nhsDrugs.length} NHS A-to-Z medicines for seeding.`);
    } else {
      console.warn(`NHS medicines file not found at ${nhsDrugsPath}`);
    }
  } catch (err) {
    console.error('Failed to load NHS medicines from JSON:', err.message);
  }

  // Helper to get random item
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomSubset = (arr, num) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  };
  const getRandomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // 2. Generate 495+ random high-fidelity medicines by mimicking templates
  const classes = Object.values(DRUG_CLASSES);
  const commonSideEffectsPool = [
    'Nausea', 'Vomiting', 'Diarrhea', 'Headache', 'Dizziness', 'Drowsiness', 'Fatigue', 
    'Dry mouth', 'Stomach pain', 'Constipation', 'Muscle aches', 'Joint pain', 'Rash', 
    'Insomnia', 'Blurry vision', 'Heartburn', 'Increased appetite', 'Weight change', 'Flushing'
  ];
  const seriousSideEffectsPool = [
    'Severe allergic reaction (anaphylaxis)', 'Stevens-Johnson syndrome', 'Liver failure', 
    'Kidney failure', 'Internal bleeding', 'Shortness of breath', 'Chest pain', 'Irregular heart beat', 
    'Depression and suicidal thoughts', 'Seizures', 'Uncontrolled muscle movements', 
    'Pancreatitis', 'Jaundice', 'Anemia', 'Sudden vision loss', 'Paresthesia (numbness/tingling)'
  ];
  const longTermEffectsPool = [
    'Osteoporosis', 'Bone density reduction', 'Drug tolerance', 'Increased cardiovascular risk', 
    'Kidney damage', 'Liver enzyme elevation', 'Vitamin malabsorption', 'Electrolyte imbalance', 
    'Physical dependence', 'Metabolic syndrome', 'Chronic gastritis', 'Cognitive slowdown'
  ];

  // We need to generate up to 510 total medicines (CORE_DRUGS are 10, so generate 500 more)
  const totalToGenerate = 500;
  
  for (let i = 0; i < totalToGenerate; i++) {
    const drugClass = getRandom(classes);
    
    // Generate unique Brand and Generic Names
    let brandName = '';
    let genericName = '';
    let attempt = 0;
    
    while (attempt < 50) {
      brandName = getRandom(DRUG_PREFIXES) + getRandom(DRUG_SUFFIXES);
      brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
      
      const root = getRandom(GENERIC_ROOTS);
      const suffixNum = i + 100;
      genericName = `${root.substring(0, root.length - 2)}i${getRandom(['n', 'x', 'l', 'm', 'd', 's'])}-${suffixNum}`;
      
      // Check for uniqueness
      if (!medicines.some(m => m.name === brandName || m.generic_name === genericName)) {
        break;
      }
      attempt++;
    }

    // Set organ impact based on drug class profiles
    let organ_impact = { brain: 10, heart: 10, liver: 15, kidneys: 15, lungs: 5, stomach: 10 };
    let contraindications = [];
    let uses = 'General therapeutic indication.';
    let mechanism = 'Mechanism of action typical for ' + drugClass + '.';
    let warnings = 'Use with caution. Avoid concurrent hazardous substances.';

    if (drugClass.includes('NSAID')) {
      organ_impact = { brain: 15, heart: 35, liver: 20, kidneys: 50, lungs: 10, stomach: 75 };
      contraindications = ['Asthma', 'Kidney Disease', 'Pregnancy', 'Liver Disease'];
      uses = 'Relief of pain and reduction of swelling/inflammation.';
      mechanism = 'Inhibition of cyclooxygenase enzymes preventing prostaglandin synthesis.';
      warnings = 'Cardiovascular thrombotic risk. Gastrointestinal ulceration and bleeding risk.';
    } else if (drugClass.includes('Anticoagulant')) {
      organ_impact = { brain: 35, heart: 20, liver: 40, kidneys: 30, lungs: 10, stomach: 60 };
      contraindications = ['Pregnancy', 'Liver Disease', 'Stroke'];
      uses = 'Prevention of clotting and embolisms.';
      mechanism = 'Interferes with coagulation factors cascades.';
      warnings = 'Severe bleeding hazards. Avoid direct trauma.';
    } else if (drugClass.includes('Antibiotic')) {
      organ_impact = { brain: 5, heart: 10, liver: 25, kidneys: 40, lungs: 5, stomach: 45 };
      uses = 'Treatment of bacterial infections.';
      mechanism = 'Interferes with bacterial growth, cell wall structure, or protein synthesis.';
      if (drugClass.includes('Penicillin')) {
        contraindications = ['Allergies'];
      }
    } else if (drugClass.includes('Blocker') || drugClass.includes('ACE') || drugClass.includes('Calcium')) {
      organ_impact = { brain: 20, heart: 70, liver: 20, kidneys: 35, lungs: 25, stomach: 15 };
      contraindications = ['Heart Disease', 'Hypertension'];
      if (drugClass.includes('Beta-Adrenergic Blocker')) {
        contraindications.push('Asthma');
      }
      uses = 'Management of hypertension and chest pain.';
      mechanism = 'Decreases heart rate, force of contraction, or relaxes vascular walls.';
    } else if (drugClass.includes('Statin')) {
      organ_impact = { brain: 10, heart: 15, liver: 65, kidneys: 20, lungs: 5, stomach: 20 };
      contraindications = ['Liver Disease', 'Pregnancy'];
      uses = 'Lowering of cholesterol levels.';
      mechanism = 'Competitive inhibition of HMG-CoA reductase.';
    } else if (drugClass.includes('Antidiabetic')) {
      organ_impact = { brain: 10, heart: 15, liver: 25, kidneys: 65, lungs: 5, stomach: 35 };
      contraindications = ['Kidney Disease', 'Liver Disease', 'Diabetes'];
      uses = 'Glycemic control in Type 2 Diabetes.';
      mechanism = 'Increases insulin response or reduces liver gluconeogenesis.';
    } else if (drugClass.includes('Bronchodilator')) {
      organ_impact = { brain: 15, heart: 40, liver: 10, kidneys: 15, lungs: 80, stomach: 5 };
      uses = 'Relief of asthma and COPD bronchospasms.';
      mechanism = 'Stimulates beta-2 adrenergic receptors resulting in airway muscle relaxation.';
    }

    // Set random dosages
    const dosages = getRandomSubset(['5mg', '10mg', '20mg', '50mg', '100mg', '250mg', '500mg'], getRandomRange(1, 3)).sort();
    
    // Set random side effects
    const common = getRandomSubset(commonSideEffectsPool, getRandomRange(2, 4));
    const serious = getRandomSubset(seriousSideEffectsPool, getRandomRange(1, 3));
    const long_term = getRandomSubset(longTermEffectsPool, getRandomRange(1, 2));

    // Seed 1-2 random interactions with core drugs
    const interactions = [];
    if (Math.random() > 0.4) {
      const coreInteracting = getRandom(CORE_DRUGS);
      // Give a random severity
      const severity = getRandom(['low', 'moderate', 'high']);
      interactions.push({
        with_drug: coreInteracting.generic_name,
        severity: severity,
        mechanism: `Class action metabolic or pharmacodynamic overlap with ${coreInteracting.generic_name}.`,
        impact: `Potential increase in adverse effects or reduction of safety boundaries.`,
        action: `Monitor patients closely if co-prescribed. Assess parameters regularly.`
      });
    }

    // Set 1-2 random alternatives
    const alternatives = [
      {
        name: getRandom(DRUG_PREFIXES) + '替代',
        generic_name: getRandom(GENERIC_ROOTS),
        safety_rating: (Math.random() * 2 + 3).toFixed(1),
        interaction_risk: getRandom(['low', 'moderate']),
        price_estimate: getRandom(['$', '$$', '$$$']),
        effectiveness_score: getRandomRange(80, 98)
      }
    ];

    medicines.push({
      id: idCounter++,
      name: brandName,
      generic_name: genericName,
      drug_class: drugClass,
      dosages: dosages,
      warnings: warnings,
      uses: uses,
      mechanism: mechanism,
      storage: 'Store at controlled room temperature.',
      side_effects: {
        common,
        serious,
        long_term,
        organ_impact
      },
      contraindications: contraindications,
      interactions: interactions,
      alternatives: alternatives
    });
  }

  // Seeding local DB
  const localDb = getLocalDb();
  localDb.medicines = medicines;
  localDb.patients = SAMPLE_PATIENTS;
  localDb.reports = [
    {
      id: 1,
      patient_id: 1,
      patient_name: 'John Doe',
      prescription: [
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 Days' },
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 Days' }
      ],
      risk_score: 35,
      analysis: {
        interactions: [],
        allergies: [],
        contraindications: [
          {
            drug: 'Metformin',
            condition: 'Chronic Kidney Disease',
            warning: 'Metformin increases the risk of lactic acidosis in severe kidney disease (eGFR < 30 mL/min). Monitor kidney markers closely.'
          }
        ],
        safety_score: 65,
        recommendations: 'Prescription displays moderate contraindication risk. Metformin should be monitored or swapped for renal-safe alternatives like Empagliflozin.'
      },
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() // 3 days ago
    }
  ];
  setLocalDb(localDb);

  console.log(`\n✅ Database seed successful!`);
  console.log(`Seeded ${medicines.length} medicines in the system.`);
  console.log(`Seeded ${SAMPLE_PATIENTS.length} patient records.`);
  console.log(`Mode: ${isFallback() ? 'JSON File Database' : 'PostgreSQL DB'}`);

  // 3. PostgreSQL SQL creation for manual running if needed
  if (!isFallback()) {
    try {
      console.log('Seeding PostgreSQL database tables...');
      // Create tables
      await query(`
        CREATE TABLE IF NOT EXISTS medicines (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          generic_name VARCHAR(100) NOT NULL,
          drug_class VARCHAR(100) NOT NULL,
          dosages JSONB,
          warnings TEXT,
          uses TEXT,
          mechanism TEXT,
          storage TEXT,
          side_effects JSONB,
          contraindications JSONB,
          interactions JSONB,
          alternatives JSONB
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS patients (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          age INT,
          gender VARCHAR(20),
          weight VARCHAR(20),
          height VARCHAR(20),
          blood_group VARCHAR(10),
          allergies JSONB,
          existing_conditions JSONB
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS reports (
          id SERIAL PRIMARY KEY,
          patient_id INT,
          patient_name VARCHAR(100),
          prescription JSONB,
          risk_score INT,
          analysis JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Clear existing records
      await query('TRUNCATE TABLE medicines RESTART IDENTITY CASCADE;');
      await query('TRUNCATE TABLE patients RESTART IDENTITY CASCADE;');

      // Insert medicines
      for (const m of medicines) {
        await query(
          `INSERT INTO medicines (name, generic_name, drug_class, dosages, warnings, uses, mechanism, storage, side_effects, contraindications, interactions, alternatives) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            m.name,
            m.generic_name,
            m.drug_class,
            JSON.stringify(m.dosages),
            m.warnings,
            m.uses,
            m.mechanism,
            m.storage,
            JSON.stringify(m.side_effects),
            JSON.stringify(m.contraindications),
            JSON.stringify(m.interactions),
            JSON.stringify(m.alternatives)
          ]
        );
      }

      // Insert patients
      for (const p of SAMPLE_PATIENTS) {
        await query(
          `INSERT INTO patients (name, age, gender, weight, height, blood_group, allergies, existing_conditions) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            p.name,
            p.age,
            p.gender,
            p.weight,
            p.height,
            p.blood_group,
            JSON.stringify(p.allergies),
            JSON.stringify(p.existing_conditions)
          ]
        );
      }
      
      console.log('PostgreSQL tables seeded successfully!');
    } catch (pgErr) {
      console.error('Error seeding PostgreSQL tables, continuing with local JSON seeder:', pgErr.message);
    }
  }
}

seed().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Seed script crashed:', err);
  process.exit(1);
});
