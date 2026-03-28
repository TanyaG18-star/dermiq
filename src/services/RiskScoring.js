// ============================================
// DermIQ Clinical Risk Scoring Engine v2.0
// Research-Grade Weighted Scoring System
// Based on: ABCDE Rule + Triage Protocols
// ============================================

export const riskCategories = [
  {
    category: '🔥 Systemic Symptoms',
    description: 'Symptoms affecting whole body',
    factors: [
      {
        id: 'fever',
        label: 'Fever above 100°F / 38°C',
        icon: '🌡️',
        weight: 3,
        description: 'Body temperature elevated with skin condition',
        research: 'Fever + skin = possible systemic infection (cellulitis, SSSS)'
      },
      {
        id: 'chills',
        label: 'Chills or Shivering',
        icon: '🥶',
        weight: 2,
        description: 'Feeling cold and shivering despite normal temperature',
        research: 'Indicates possible bacteremia or systemic immune response'
      },
      {
        id: 'fatigue',
        label: 'Extreme Fatigue or Weakness',
        icon: '😴',
        weight: 2,
        description: 'Unusual tiredness combined with skin symptoms',
        research: 'Systemic involvement indicator in autoimmune skin conditions'
      },
    ]
  },
  {
    category: '📍 Lesion Characteristics (ABCDE Rule)',
    description: 'Based on dermatology ABCDE melanoma screening',
    factors: [
      {
        id: 'asymmetry',
        label: 'Asymmetrical Shape',
        icon: '🔵',
        weight: 3,
        description: 'One half does not match the other half',
        research: 'ABCDE Rule - A: Asymmetry is a key melanoma indicator'
      },
      {
        id: 'irregular_border',
        label: 'Irregular or Ragged Border',
        icon: '〰️',
        weight: 3,
        description: 'Edges are notched, uneven or blurred',
        research: 'ABCDE Rule - B: Border irregularity in malignant lesions'
      },
      {
        id: 'color_variation',
        label: 'Multiple Colors in One Spot',
        icon: '🎨',
        weight: 4,
        description: 'Mix of brown, black, red, white or blue',
        research: 'ABCDE Rule - C: Color variation strongly suggests melanoma'
      },
      {
        id: 'large_diameter',
        label: 'Size Larger than 6mm',
        icon: '📏',
        weight: 3,
        description: 'Spot is larger than a pencil eraser (6mm)',
        research: 'ABCDE Rule - D: Diameter >6mm warrants dermatologist review'
      },
      {
        id: 'evolving',
        label: 'Rapidly Changing / Evolving',
        icon: '📈',
        weight: 5,
        description: 'Changing in size, shape or color over weeks',
        research: 'ABCDE Rule - E: Evolution is the most important warning sign'
      },
    ]
  },
  {
    category: '🩹 Physical Symptoms',
    description: 'Direct skin and body symptoms',
    factors: [
      {
        id: 'blistering',
        label: 'Blisters or Fluid-Filled Bumps',
        icon: '🫧',
        weight: 5,
        description: 'Raised bumps filled with clear or yellow fluid',
        research: 'Blistering indicates pemphigus, bullous disorders or severe burns'
      },
      {
        id: 'bleeding',
        label: 'Spontaneous Bleeding',
        icon: '🩸',
        weight: 5,
        description: 'Skin lesion bleeds without any injury',
        research: 'Spontaneous bleeding from lesion = high malignancy suspicion'
      },
      {
        id: 'severe_pain',
        label: 'Severe Pain (7/10 or more)',
        icon: '😣',
        weight: 4,
        description: 'Intense burning, stabbing or throbbing pain',
        research: 'Severe pain suggests herpes zoster, cellulitis, or deep infection'
      },
      {
        id: 'swelling',
        label: 'Significant Swelling',
        icon: '🫀',
        weight: 3,
        description: 'Noticeable swelling around the affected area',
        research: 'Edema + rash = possible allergic reaction or deep tissue infection'
      },
      {
        id: 'spreading',
        label: 'Rapidly Spreading within 24-48 hours',
        icon: '🔴',
        weight: 4,
        description: 'Condition spreading to new skin areas quickly',
        research: 'Rapid spreading = possible cellulitis, impetigo, or necrotizing fasciitis'
      },
    ]
  },
  {
    category: '⚠️ High Risk Patient Factors',
    description: 'Patient background risk factors',
    factors: [
      {
        id: 'immunocompromised',
        label: 'Immunocompromised (Diabetes / HIV / Steroids)',
        icon: '🛡️',
        weight: 4,
        description: 'Weakened immune system due to illness or medication',
        research: 'Immunocompromised patients have 3x higher risk of skin infections'
      },
      {
        id: 'elderly',
        label: 'Age above 60 or below 5',
        icon: '👴',
        weight: 3,
        description: 'Very young or elderly patients at higher risk',
        research: 'Extreme age groups have reduced immune response to skin conditions'
      },
      {
        id: 'family_history',
        label: 'Family History of Skin Cancer',
        icon: '🧬',
        weight: 3,
        description: 'Close relative had melanoma or skin cancer',
        research: 'Family history increases melanoma risk by 2-3x (JAAD 2021)'
      },
      {
        id: 'sun_exposure',
        label: 'Excessive Sun Exposure History',
        icon: '☀️',
        weight: 2,
        description: 'Years of unprotected sun exposure or tanning beds',
        research: 'UV exposure is responsible for 90% of non-melanoma skin cancers'
      },
    ]
  },
]

// Flatten all factors for easy access
export const riskFactors = riskCategories.flatMap(cat => cat.factors)

export const calculateRiskScore = (selectedFactors) => {
  let totalScore = 0
  let triggeredFactors = []

  riskFactors.forEach(factor => {
    if (selectedFactors[factor.id]) {
      totalScore += factor.weight
      triggeredFactors.push(factor)
    }
  })

  const maxScore = riskFactors.reduce((sum, f) => sum + f.weight, 0)

  let classification = {}

  if (totalScore === 0) {
    classification = {
      level: 'No Risk',
      icon: '✅',
      emoji: '😊',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      badgeColor: 'bg-gray-100 text-gray-700',
      barColor: 'bg-gray-400',
      message: 'No symptoms selected. Skin appears healthy.',
      urgency: 'Continue regular skincare routine.',
      recommendation: [
        '🧴 Maintain daily CTM routine',
        '☀️ Apply SPF 30 sunscreen daily',
        '💧 Stay hydrated',
        '😴 Get 7-8 hours of sleep',
      ]
    }
  } else if (totalScore <= 4) {
    classification = {
      level: 'Routine',
      icon: '🟢',
      emoji: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      badgeColor: 'bg-green-100 text-green-700',
      barColor: 'bg-green-500',
      message: 'Low risk. Standard skincare routine recommended.',
      urgency: 'Visit dermatologist within 2-4 weeks if no improvement.',
      recommendation: [
        '🧴 Use gentle cleanser twice daily',
        '💧 Apply moisturizer morning and night',
        '☀️ SPF 30+ sunscreen every day',
        '📸 Monitor and photograph the area weekly',
        '🥗 Maintain healthy diet and hydration',
      ]
    }
  } else if (totalScore <= 9) {
    classification = {
      level: 'Priority',
      icon: '🟡',
      emoji: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-700',
      badgeColor: 'bg-yellow-100 text-yellow-700',
      barColor: 'bg-yellow-500',
      message: 'Moderate risk. Professional consultation advised.',
      urgency: 'Visit a dermatologist within 3-5 days.',
      recommendation: [
        '🏥 Book dermatologist appointment soon',
        '📸 Take daily photos to track changes',
        '🚫 Do not self-medicate with strong products',
        '💊 OTC antihistamine if itching is severe',
        '🧴 Use only gentle fragrance-free products',
      ]
    }
  } else {
    classification = {
      level: 'Emergency',
      icon: '🔴',
      emoji: '🚨',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-100 text-red-700',
      barColor: 'bg-red-500',
      message: 'High risk! Immediate medical attention required.',
      urgency: 'Seek emergency help within 24 hours!',
      recommendation: [
        '🚨 Go to emergency dermatology immediately',
        '🚫 Do NOT apply any products on the area',
        '📞 Call your doctor right now',
        '🏥 Visit nearest hospital if worsening',
        '📸 Document with photos for the doctor',
      ]
    }
  }

  return {
    totalScore,
    maxScore,
    classification,
    triggeredFactors,
    riskPercentage: Math.round((totalScore / maxScore) * 100)
  }
}

export const compareModels = (selectedFactors) => {
  const scoringResult = calculateRiskScore(selectedFactors)

  const count = Object.values(selectedFactors).filter(Boolean).length
  let ruleLevel = 'Routine'
  if (count >= 5) ruleLevel = 'Emergency'
  else if (count >= 3) ruleLevel = 'Priority'

  const agree = scoringResult.classification.level === ruleLevel

  return {
    scoringBased: scoringResult.classification.level,
    ruleBased: ruleLevel,
    agree,
    insight: agree
      ? '✅ Both models agree on this classification.'
      : `⚡ Models DISAGREE! Scoring says "${scoringResult.classification.level}" but Rule-based says "${ruleLevel}". Weighted scoring is more clinically accurate!`
  }
}