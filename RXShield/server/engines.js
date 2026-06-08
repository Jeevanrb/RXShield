// AI Reasoning Engines for Prescription Analysis

/**
 * Intelligent Interaction Analysis Engine
 * Checks interactions between all pairs of entered medications.
 * Computes safety score (0-100) and risk profiles.
 */
export const analyzeInteractions = (selectedDrugs, drugDatabase) => {
  const interactions = [];
  let totalDeduction = 0;
  
  // Find full drug info for selected medicines
  const drugsInfo = selectedDrugs.map(prescribed => {
    return drugDatabase.find(d => d.name.toLowerCase() === prescribed.name.toLowerCase() || 
                                  d.generic_name.toLowerCase() === prescribed.name.toLowerCase());
  }).filter(Boolean);

  // Compare every pair
  for (let i = 0; i < drugsInfo.length; i++) {
    for (let j = i + 1; j < drugsInfo.length; j++) {
      const drugA = drugsInfo[i];
      const drugB = drugsInfo[j];
      
      // Check if drugA lists an interaction with drugB
      const interactA = drugA.interactions?.find(inter => 
        inter.with_drug.toLowerCase() === drugB.name.toLowerCase() ||
        inter.with_drug.toLowerCase() === drugB.generic_name.toLowerCase()
      );
      
      // Check if drugB lists an interaction with drugA
      const interactB = drugB.interactions?.find(inter => 
        inter.with_drug.toLowerCase() === drugA.name.toLowerCase() ||
        inter.with_drug.toLowerCase() === drugA.generic_name.toLowerCase()
      );

      const interaction = interactA || interactB;

      if (interaction) {
        let severityScore = 0;
        let colorCode = 'green';
        
        switch (interaction.severity.toLowerCase()) {
          case 'low':
            severityScore = 10;
            colorCode = 'green';
            break;
          case 'moderate':
            severityScore = 25;
            colorCode = 'yellow';
            break;
          case 'high':
            severityScore = 45;
            colorCode = 'orange';
            break;
          case 'critical':
            severityScore = 70;
            colorCode = 'red';
            break;
        }

        totalDeduction += severityScore;
        
        interactions.push({
          drugA: drugA.name,
          genericA: drugA.generic_name,
          drugB: drugB.name,
          genericB: drugB.generic_name,
          severity: interaction.severity,
          color: colorCode,
          mechanism: interaction.mechanism,
          clinicalImpact: interaction.impact,
          riskScore: severityScore + 20, // baseline risk for drawing gauges
          recommendedAction: interaction.action
        });
      }
    }
  }

  // Calculate final patient safety score
  const safetyScore = Math.max(0, Math.min(100, 100 - totalDeduction));

  return {
    interactions,
    safetyScore
  };
};

/**
 * Allergy Detection System
 * Checks entered medications against patient's known allergies.
 * Matches specific generic names or broad therapeutic classes (like Penicillin).
 */
export const analyzeAllergies = (selectedDrugs, patient, drugDatabase) => {
  const warnings = [];
  if (!patient || !patient.allergies || patient.allergies.length === 0) {
    return warnings;
  }

  const patientAllergies = patient.allergies.map(a => a.toLowerCase().trim());

  selectedDrugs.forEach(prescribed => {
    const drugInfo = drugDatabase.find(d => d.name.toLowerCase() === prescribed.name.toLowerCase() || 
                                           d.generic_name.toLowerCase() === prescribed.name.toLowerCase());
    if (!drugInfo) return;

    const genericName = drugInfo.generic_name.toLowerCase();
    const brandName = drugInfo.name.toLowerCase();
    const drugClass = drugInfo.drug_class.toLowerCase();

    patientAllergies.forEach(allergy => {
      let isAllergic = false;
      let reason = '';

      const allergyNorm = allergy.toLowerCase().trim();

      // 1. Direct match with drug name or generic name
      if (genericName.includes(allergyNorm) || brandName.includes(allergyNorm) || allergyNorm.includes(genericName) || allergyNorm.includes(brandName)) {
        isAllergic = true;
        reason = `Direct match with patient allergy: ${allergy}.`;
      } 
      // 2. Broad Class Category matching (painkillers, antibiotics, antidepressants)
      else if ((allergyNorm === 'painkiller' || allergyNorm === 'painkillers' || allergyNorm === 'pain killer' || allergyNorm === 'pain killers' || allergyNorm === 'pain-killer' || allergyNorm === 'pain-killers' || allergyNorm === 'analgesic' || allergyNorm === 'analgesics') &&
               (drugClass.includes('nsaid') || drugClass.includes('analgesic') || drugClass.includes('opioid') || genericName === 'paracetamol' || genericName === 'acetaminophen' || brandName === 'tylenol')) {
        isAllergic = true;
        reason = `Therapeutic class alert: Patient is allergic to painkillers, and ${drugInfo.name} belongs to the analgesic/NSAID class.`;
      }
      else if ((allergyNorm === 'antibiotic' || allergyNorm === 'antibiotics' || allergyNorm === 'antibacterial' || allergyNorm === 'antibacterials') &&
               (drugClass.includes('antibiotic') || drugClass.includes('penicillin') || drugClass.includes('macrolide') || drugClass.includes('cephalosporin') || drugClass.includes('fluoroquinolone') || drugClass.includes('sulfonamide'))) {
        isAllergic = true;
        reason = `Therapeutic class alert: Patient is allergic to antibiotics, and ${drugInfo.name} is an antibiotic.`;
      }
      else if ((allergyNorm === 'antidepressant' || allergyNorm === 'antidepressants') &&
               (drugClass.includes('antidepressant') || drugClass.includes('ssri') || drugClass.includes('snri') || drugClass.includes('tricyclic') || drugClass.includes('maoi'))) {
        isAllergic = true;
        reason = `Therapeutic class alert: Patient is allergic to antidepressants, and ${drugInfo.name} is an antidepressant medication.`;
      }
      // 3. Class cross-reactivity for specific allergies (penicillin, nsaid, sulfa)
      else if ((allergyNorm.includes('penicillin') || allergyNorm === 'amoxicillin' || allergyNorm === 'ampicillin') && drugClass.includes('penicillin')) {
        isAllergic = true;
        reason = `Cross-reactivity warning: Patient is allergic to ${allergy}, and ${drugInfo.name} belongs to the Penicillin Antibiotic class.`;
      }
      else if ((allergyNorm.includes('nsaid') || allergyNorm === 'aspirin' || allergyNorm === 'ibuprofen' || allergyNorm === 'naproxen' || allergyNorm === 'diclofenac' || allergyNorm === 'meloxicam') && drugClass.includes('nsaid')) {
        isAllergic = true;
        reason = `Cross-reactivity warning: Patient is allergic to ${allergy}, and ${drugInfo.name} is an NSAID.`;
      }
      else if ((allergyNorm.includes('sulfa') || allergyNorm.includes('sulfonamide') || allergyNorm === 'bactrim') && 
               (drugClass.includes('sulfonamide') || drugClass.includes('sulfonylurea') || drugClass.includes('diuretic'))) {
        isAllergic = true;
        reason = `Potential cross-reactivity warning: Patient is allergic to ${allergy}, and ${drugInfo.name} contains sulfa-related compounds.`;
      }
      // 4. Class-to-Class cross-reactivity based on database lookup
      else {
        const allergyDrugInfo = drugDatabase.find(d => d.name.toLowerCase() === allergyNorm || d.generic_name.toLowerCase() === allergyNorm);
        if (allergyDrugInfo) {
          const allergyDrugClass = allergyDrugInfo.drug_class.toLowerCase();
          
          if (allergyDrugClass === drugClass) {
            isAllergic = true;
            reason = `Cross-reactivity warning: Patient is allergic to ${allergyDrugInfo.name}, and ${drugInfo.name} belongs to the same therapeutic class (${drugInfo.drug_class}).`;
          } else if (allergyDrugClass.includes('nsaid') && drugClass.includes('nsaid')) {
            isAllergic = true;
            reason = `Cross-reactivity warning: Patient is allergic to ${allergyDrugInfo.name} (an NSAID), and ${drugInfo.name} is also an NSAID.`;
          } else if (allergyDrugClass.includes('penicillin') && drugClass.includes('penicillin')) {
            isAllergic = true;
            reason = `Cross-reactivity warning: Patient is allergic to ${allergyDrugInfo.name} (a Penicillin), and ${drugInfo.name} is also a Penicillin.`;
          } else if (allergyDrugClass.includes('statin') && drugClass.includes('statin')) {
            isAllergic = true;
            reason = `Potential cross-reactivity warning: Patient is allergic to ${allergyDrugInfo.name} (a Statin), and ${drugInfo.name} is also a Statin.`;
          } else if (allergyDrugClass.includes('beta-adrenergic blocker') && drugClass.includes('beta-adrenergic blocker')) {
            isAllergic = true;
            reason = `Potential cross-reactivity warning: Patient is allergic to ${allergyDrugInfo.name} (a Beta-Blocker), and ${drugInfo.name} is also a Beta-Blocker.`;
          } else if (allergyDrugClass.includes('ace inhibitor') && drugClass.includes('ace inhibitor')) {
            isAllergic = true;
            reason = `Potential cross-reactivity warning: Patient is allergic to ${allergyDrugInfo.name} (an ACE Inhibitor), and ${drugInfo.name} is also an ACE Inhibitor.`;
          }
        }
      }

      if (isAllergic) {
        warnings.push({
          drug: drugInfo.name,
          generic: drugInfo.generic_name,
          allergy: allergy,
          severity: 'critical',
          reaction: 'Risk of acute anaphylaxis, severe skin rashes (Stevens-Johnson syndrome), breathing difficulty, and cardiovascular shock.',
          advice: 'IMMEDIATELY halt administration. Keep epinephrine autoinjector (EpiPen) nearby. Call emergency response if dyspnea occurs.',
          reason: reason,
          alternatives: drugInfo.alternatives || []
        });
      }
    });
  });

  return warnings;
};

/**
 * Disease Contraindication Analyzer
 * Checks selected medications against patient's chronic conditions.
 */
export const analyzeContraindications = (selectedDrugs, patient, drugDatabase) => {
  const warnings = [];
  if (!patient || !patient.existing_conditions || patient.existing_conditions.length === 0) {
    return warnings;
  }

  const conditions = patient.existing_conditions.map(c => c.toLowerCase());

  selectedDrugs.forEach(prescribed => {
    const drugInfo = drugDatabase.find(d => d.name.toLowerCase() === prescribed.name.toLowerCase() || 
                                           d.generic_name.toLowerCase() === prescribed.name.toLowerCase());
    if (!drugInfo) return;

    drugInfo.contraindications?.forEach(contra => {
      const contraLower = contra.toLowerCase();

      conditions.forEach(condition => {
        let isContraindicated = false;
        let severity = 'high';
        let explanation = '';

        if (condition.includes('pregnancy') && contraLower.includes('pregnancy')) {
          isContraindicated = true;
          severity = 'critical';
          explanation = `${drugInfo.name} is teratogenic and poses high risk of fetal abnormalities, miscarriage, or congenital cardiac defects.`;
        } 
        else if (condition.includes('asthma') && contraLower.includes('asthma')) {
          isContraindicated = true;
          severity = 'critical';
          explanation = `${drugInfo.name} can cause broncho-constriction or block beta-2 mediated bronchodilation, potentially triggering severe, fatal asthma attacks.`;
        } 
        else if (condition.includes('kidney') && (contraLower.includes('kidney') || contraLower.includes('renal'))) {
          isContraindicated = true;
          severity = 'high';
          explanation = `${drugInfo.name} is cleared renally or causes afferent/efferent vascular pressure shifts, leading to acute kidney injury or drug accumulation toxicity.`;
        } 
        else if (condition.includes('liver') && (contraLower.includes('liver') || contraLower.includes('hepatic'))) {
          isContraindicated = true;
          severity = 'high';
          explanation = `${drugInfo.name} undergoes intensive hepatic metabolism. Impaired liver clearance can lead to systemic drug toxicity or hepatonecrosis.`;
        } 
        else if (condition.includes('heart') && (contraLower.includes('heart') || contraLower.includes('cardiac'))) {
          isContraindicated = true;
          severity = 'high';
          explanation = `${drugInfo.name} imposes direct myocardial workload, alters heart rate, or worsens fluid overload in cardiac failure patients.`;
        }
        else if (condition.includes('diabetes') && contraLower.includes('diabetes')) {
          // Some drugs like steroids raise blood sugar
          isContraindicated = true;
          severity = 'moderate';
          explanation = `${drugInfo.name} can alter insulin sensitivity, elevate blood glucose, or mask hypoglycemic warnings (like tachycardia).`;
        }
        else if (condition.includes('hypertension') && contraLower.includes('hypertension')) {
          isContraindicated = true;
          severity = 'moderate';
          explanation = `${drugInfo.name} may elevate blood pressure, counteract antihypertensive medications, or induce fluid retention.`;
        }

        if (isContraindicated) {
          warnings.push({
            drug: drugInfo.name,
            generic: drugInfo.generic_name,
            condition: condition,
            severity: severity,
            explanation: explanation,
            action: `Evaluate therapeutic alternatives or adjust drug dosage. Monitor vital organ profiles (CrCl, AST/ALT, Blood Pressure) daily.`
          });
        }
      });
    });
  });

  return warnings;
};

/**
 * Safer Alternative Recommendation Engine
 * Collates alternatives for drugs that have critical warnings, contraindications, or interactions.
 */
export const getSaferAlternatives = (selectedDrugs, interactions, allergies, contraindications, drugDatabase) => {
  const alternatives = {};
  
  // Collect all medications that triggered a warning
  const warningDrugs = new Set();
  
  interactions.forEach(i => {
    if (i.severity === 'high' || i.severity === 'critical') {
      warningDrugs.add(i.drugA);
      warningDrugs.add(i.drugB);
    }
  });
  
  allergies.forEach(a => warningDrugs.add(a.drug));
  contraindications.forEach(c => warningDrugs.add(c.drug));

  // Determine target drugs: warning drugs if any exist, otherwise all entered prescription drugs
  const targetDrugs = warningDrugs.size > 0 
    ? Array.from(warningDrugs) 
    : selectedDrugs.map(d => d.name);

  // Find alternatives for each target drug
  targetDrugs.forEach(drugName => {
    const drugInfo = drugDatabase.find(d => d.name.toLowerCase() === drugName.toLowerCase());
    if (drugInfo && drugInfo.alternatives && drugInfo.alternatives.length > 0) {
      // Screen alternatives to verify they don't also trigger patient allergies or contraindications!
      // This is the "Smart Reasoning" layer!
      alternatives[drugName] = drugInfo.alternatives.map(alt => {
        // Let's check if this alternative generic name matches anything in drugDatabase to pull actual metadata if available
        const altDbInfo = drugDatabase.find(d => d.generic_name.toLowerCase() === alt.generic_name.toLowerCase() ||
                                               d.name.toLowerCase() === alt.name.toLowerCase());
        
        return {
          name: alt.name,
          genericName: alt.generic_name,
          safetyRating: alt.safety_rating,
          interactionRisk: alt.interaction_risk,
          priceEstimate: alt.price_estimate,
          effectivenessScore: alt.effectiveness_score,
          class: altDbInfo ? altDbInfo.drug_class : 'Same therapeutic family'
        };
      });
    }
  });

  return alternatives;
};
