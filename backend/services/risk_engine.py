# services/risk_engine.py
# Calculates risk score based on symptoms

def calculate_risk(fever, spreading, pain, blister):
    """
    Risk Formula:
    RiskScore = 2F + 3S + 4P + 5B
    F = Fever
    S = Spreading
    P = Pain
    B = Blistering
    """
    score = 0
    if fever:     score += 2
    if spreading: score += 3
    if pain:      score += 4
    if blister:   score += 5

    # Classify risk level
    if score <= 3:
        level = 'Routine'
    elif score <= 7:
        level = 'Priority'
    else:
        level = 'Emergency'

    return {
        'score': score,
        'level': level
    }