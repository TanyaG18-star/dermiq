# services/recommendation_engine.py
# Rule-based recommendation engine for skin conditions

def get_recommendation(condition, severity):
    """
    Returns skincare advice based on condition and severity
    Rule-based logic — no prescription drugs suggested
    """

    advice = []
    routine_type = 'Routine'

    condition_lower = condition.lower()

    # ─────────────────────────────
    # ACNE
    # ─────────────────────────────
    if 'acne' in condition_lower:
        if severity.lower() == 'low':
            routine_type = 'Routine'
            advice = [
                'Wash face twice daily with gentle cleanser',
                'Use oil-free moisturizer',
                'Apply Benzoyl Peroxide 2.5% cream',
                'Use Salicylic Acid face wash',
                'Apply SPF 30+ sunscreen daily',
                'Avoid touching your face',
                'Drink plenty of water',
            ]
        else:
            routine_type = 'Priority'
            advice = [
                'Consult a dermatologist immediately',
                'Avoid squeezing or popping pimples',
                'Use gentle non-comedogenic products',
                'Apply ice to reduce swelling',
            ]

    # ─────────────────────────────
    # FUNGAL
    # ─────────────────────────────
    elif 'fungal' in condition_lower:
        routine_type = 'Routine'
        advice = [
            'Keep the affected area clean and dry',
            'Apply Clotrimazole cream twice daily',
            'Wear loose fitting cotton clothes',
            'Avoid sharing towels or clothing',
            'Change socks and underwear daily',
        ]

    # ─────────────────────────────
    # ECZEMA
    # ─────────────────────────────
    elif 'eczema' in condition_lower:
        if severity.lower() == 'low':
            routine_type = 'Routine'
            advice = [
                'Moisturize skin at least twice daily',
                'Use mild soap free cleanser',
                'Avoid hot showers',
                'Wear soft cotton clothing',
                'Avoid known triggers like dust or pet hair',
            ]
        else:
            routine_type = 'Emergency'
            advice = [
                'Visit a dermatologist immediately',
                'Avoid scratching the affected area',
                'Apply cold compress for relief',
                'Use fragrance free products only',
            ]

    # ─────────────────────────────
    # PSORIASIS
    # ─────────────────────────────
    elif 'psoriasis' in condition_lower:
        routine_type = 'Priority'
        advice = [
            'Consult a dermatologist as soon as possible',
            'Keep skin moisturized at all times',
            'Avoid stress as it can trigger flare ups',
            'Use fragrance free moisturizer',
            'Avoid scratching or picking at scales',
        ]

    # ─────────────────────────────
    # DEFAULT
    # ─────────────────────────────
    else:
        routine_type = 'Routine'
        advice = [
            'Keep skin clean and moisturized',
            'Drink plenty of water daily',
            'Avoid harsh chemicals on skin',
            'Consult a doctor if condition worsens',
        ]

    return {
        'type':       routine_type,
        'advice':     advice,
        'disclaimer': 'This is not a medical diagnosis. Please consult a doctor.'
    }