import random
import hashlib
from flask import Blueprint, request, jsonify
from database.db import db
from models.report_model import Report
from services.risk_engine import calculate_risk
from services.recommendation_engine import get_recommendation
from services.ml_engine import predict_skin_condition

analysis = Blueprint('analysis', __name__)

# ─────────────────────────────────────
# ML CONDITION → CONTEXT MAP
# ─────────────────────────────────────
ML_CONDITION_MAP = {
    'Acne': {
        'description': 'Acne detected on skin surface. Caused by clogged pores, bacteria and excess sebum.',
        'details': {'acne': 0.85, 'pores': 0.60, 'oil': 0.70},
        'routine': [
            '🧴 Use salicylic acid face wash twice daily',
            '💧 Apply oil-free moisturizer only',
            '☀️ Use SPF 30+ sunscreen every morning',
            '🚫 Never pop or squeeze pimples',
            '😴 Sleep 8 hours daily to balance hormones',
            '🥗 Reduce dairy and sugar intake',
        ],
        'medicines': [
            '💊 Salicylic Acid 2% face wash',
            '💊 Benzoyl Peroxide 2.5% gel (night)',
            '💊 Niacinamide 10% serum',
        ]
    },
    'Eczema': {
        'description': 'Eczema detected. Skin shows signs of inflammation, dryness and irritation.',
        'details': {'dryness': 0.80, 'inflammation': 0.70, 'irritation': 0.65},
        'routine': [
            '💧 Moisturize with thick cream immediately after bathing',
            '🚿 Use lukewarm water only — never hot',
            '🧴 Use fragrance-free gentle cleanser',
            '🚫 Avoid wool and synthetic fabrics',
            '🥗 Identify and avoid food triggers',
            '💨 Use a humidifier indoors',
        ],
        'medicines': [
            '💊 Ceramide moisturizing cream (CeraVe)',
            '💊 Hydrocortisone 1% cream for flare-ups',
            '💊 Antihistamine tablet for itching',
        ]
    },
    'Melanoma': {
        'description': '⚠️ Melanoma risk detected. Please consult a dermatologist immediately for proper diagnosis.',
        'details': {'lesion': 0.90, 'pigmentation': 0.75, 'spot': 0.60},
        'routine': [
            '🏥 See a dermatologist IMMEDIATELY',
            '☀️ Apply SPF 50+ sunscreen every 2 hours',
            '🚫 Avoid all sun exposure until checked',
            '📸 Document the affected area with photos',
            '🚫 Do not apply any home remedies',
        ],
        'medicines': [
            '⚠️ Do not self-medicate',
            '🏥 Requires professional medical diagnosis',
            '💊 SPF 50+ mineral sunscreen only',
        ]
    },
    'Psoriasis': {
        'description': 'Psoriasis detected. Skin shows signs of rapid cell buildup causing scales and inflammation.',
        'details': {'scaling': 0.80, 'inflammation': 0.75, 'redness': 0.60},
        'routine': [
            '💧 Moisturize heavily twice daily',
            '🛁 Take short lukewarm baths with oatmeal',
            '☀️ Controlled sunlight exposure (10-15 mins daily)',
            '🚫 Avoid skin injuries and scratching',
            '😴 Manage stress — it triggers flare-ups',
            '🥗 Eat anti-inflammatory foods',
        ],
        'medicines': [
            '💊 Coal tar shampoo/cream',
            '💊 Salicylic acid cream for scaling',
            '💊 Consult doctor for prescription retinoids',
        ]
    },
    'Rosacea': {
        'description': 'Rosacea detected. Facial redness, visible blood vessels and sensitivity detected.',
        'details': {'redness': 0.75, 'sensitivity': 0.80, 'vessels': 0.60},
        'routine': [
            '🧴 Use gentle fragrance-free cleanser only',
            '☀️ SPF 50+ mineral sunscreen every day',
            '🚫 Avoid spicy food, alcohol and hot drinks',
            '🌡️ Avoid extreme temperatures',
            '💧 Use calming moisturizer with ceramides',
            '😴 Identify and avoid personal triggers',
        ],
        'medicines': [
            '💊 Azelaic acid 15% gel',
            '💊 Metronidazole 0.75% cream (prescription)',
            '💊 Mineral SPF 50+ sunscreen',
        ]
    },
    'Normal Skin': {
        'description': 'Skin appears healthy with no major conditions detected. Maintain your current routine.',
        'details': {'acne': 0.10, 'pores': 0.20, 'spot': 0.15},
        'routine': [
            '🧴 Maintain basic CTM routine daily',
            '💧 Moisturize twice daily',
            '☀️ Apply SPF 30 sunscreen every morning',
            '💧 Drink 2-3 litres of water daily',
            '🥗 Eat a balanced diet rich in antioxidants',
            '😴 Sleep 7-8 hours every night',
        ],
        'medicines': [
            '💊 Basic SPF 30 moisturizer',
            '💊 Gentle face wash',
            '💊 Vitamin C serum (optional, for glow)',
        ]
    },
    'Hyperpigmentation': {
        'description': 'Hyperpigmentation detected. Dark patches caused by excess melanin production.',
        'details': {'pigmentation': 0.85, 'spot': 0.70, 'dark_circle': 0.55},
        'routine': [
            '☀️ SPF 50+ sunscreen every 2 hours — most important step',
            '🌟 Apply Vitamin C serum every morning',
            '💧 Use Alpha Arbutin serum for dark spots',
            '🍋 Apply retinol at night for cell turnover',
            '🚫 Never pick or scratch dark spots',
            '🥗 Eat Vitamin C rich foods daily',
        ],
        'medicines': [
            '💊 Vitamin C 15-20% serum (morning)',
            '💊 Alpha Arbutin 2% serum',
            '💊 Kojic Acid cream',
            '💊 Retinol 0.5% serum (night)',
        ]
    },
    'Fungal Infection': {
        'description': 'Fungal skin infection detected. Common in humid conditions and caused by fungal overgrowth.',
        'details': {'fungal': 0.80, 'inflammation': 0.55, 'oil': 0.60},
        'routine': [
            '🧴 Use antifungal face wash or soap daily',
            '💧 Keep skin dry — pat dry after washing',
            '👕 Wear breathable cotton clothing',
            '🚿 Shower after sweating immediately',
            '🚫 Do not share towels or clothing',
            '💨 Keep affected area ventilated',
        ],
        'medicines': [
            '💊 Ketoconazole 2% face wash or cream',
            '💊 Clotrimazole 1% cream (apply twice daily)',
            '💊 Zinc pyrithione soap',
        ]
    },
}


# ─────────────────────────────────────
# CONTEXT ENGINE (age/gender/city)
# ─────────────────────────────────────
def analyze_skin_smart(image_base64, age, gender, city):
    age    = int(age) if age else 25
    city   = city.lower() if city else 'unknown'

    if age < 18:       age_group = 'teen'
    elif age < 25:     age_group = 'young_adult'
    elif age < 35:     age_group = 'adult'
    elif age < 50:     age_group = 'middle_age'
    else:              age_group = 'mature'

    severity = 'high' if age_group == 'mature' else 'low'

    return {
        'severity':  severity,
        'age_group': age_group,
    }


# ─────────────────────────────────────
# POST /analyze ← ML POWERED
# ─────────────────────────────────────
@analysis.route('/analyze', methods=['POST'])
def analyze():
    try:
        data         = request.get_json()
        image_base64 = data.get('image', '')
        age          = data.get('age', 25)
        gender       = data.get('gender', 'female')
        city         = data.get('city', 'unknown')

        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        print(f"🔍 Analyzing for: Age={age}, Gender={gender}, City={city}")

        # ── Step 1: Run ML model ──
        ml_result = predict_skin_condition(image_base64)

        if ml_result:
            condition  = ml_result['condition']
            confidence = ml_result['confidence']
            print(f"🤖 ML Model used: {condition} ({confidence}%)")
        else:
            condition  = 'Normal Skin'
            confidence = 75.0
            print(f"⚠️ ML failed — defaulting to Normal Skin")

        # ── Step 2: Get context ──
        context    = analyze_skin_smart(image_base64, age, gender, city)
        ml_context = ML_CONDITION_MAP.get(condition, ML_CONDITION_MAP['Normal Skin'])

        # ── Step 3: Override severity for serious conditions ──
        if condition in ['Melanoma']:
            severity = 'high'
        else:
            severity = context['severity']

        return jsonify({
            'success'    : True,
            'condition'  : condition,
            'severity'   : severity,
            'confidence' : confidence,
            'description': ml_context['description'],
            'details'    : ml_context['details'],
            'routine'    : ml_context['routine'],
            'medicines'  : ml_context['medicines'],
            'ml_used'    : ml_result is not None,
        }), 200

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ─────────────────────────────────────
# POST /risk-score
# ─────────────────────────────────────
@analysis.route('/risk-score', methods=['POST'])
def risk_score():
    try:
        data   = request.get_json()
        result = calculate_risk(
            fever     = data.get('fever',     False),
            spreading = data.get('spreading', False),
            pain      = data.get('pain',      False),
            blister   = data.get('blister',   False)
        )
        return jsonify({'success': True, **result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─────────────────────────────────────
# POST /save-report
# ─────────────────────────────────────
@analysis.route('/save-report', methods=['POST'])
def save_report():
    try:
        data   = request.get_json()
        report = Report(
            user_id        = data['user_id'],
            condition      = data['condition'],
            severity       = data['severity'],
            confidence     = data['confidence'],
            risk_score     = data.get('risk_score', 0),
            recommendation = data.get('recommendation', '')
        )
        db.session.add(report)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Report saved!',
            'report' : report.to_dict()
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─────────────────────────────────────
# GET /reports/<user_id>
# ─────────────────────────────────────
@analysis.route('/reports/<int:user_id>', methods=['GET'])
def get_reports(user_id):
    try:
        reports = Report.query.filter_by(user_id=user_id).all()
        return jsonify({
            'success': True,
            'reports': [r.to_dict() for r in reports]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─────────────────────────────────────
# POST /chat — AI Chatbot
# ─────────────────────────────────────
@analysis.route('/chat', methods=['POST'])
def chat():
    try:
        data         = request.get_json()
        messages     = data.get('messages', [])
        last_message = messages[-1]['content'].lower() if messages else ''

        if any(word in last_message for word in ['acne', 'pimple', 'zit', 'breakout']):
            reply = """🔬 Acne Treatment Guide:

🧴 Cleanse face twice daily with salicylic acid wash
💧 Use oil-free moisturizer only
☀️ SPF 30+ sunscreen every morning
🚫 Never pop or squeeze pimples
💊 Try Benzoyl Peroxide 2.5% cream at night
🥗 Reduce dairy and sugar intake

⚠️ If severe, please consult a dermatologist."""

        elif any(word in last_message for word in ['dark circle', 'eye', 'puffy']):
            reply = """👁️ Dark Circles Treatment:

😴 Sleep 7-8 hours every night
💧 Stay well hydrated (3L water daily)
🥶 Apply cold cucumber slices daily
☀️ Wear UV sunglasses outdoors
💊 Use Caffeine eye cream morning
💊 Vitamin K cream at night

⚠️ Persistent dark circles may need doctor consultation."""

        elif any(word in last_message for word in ['oily', 'greasy', 'shiny']):
            reply = """✨ Oily Skin Routine:

🧴 Use foaming cleanser twice daily
💧 Lightweight gel moisturizer only
☀️ Matte finish SPF 40 sunscreen
🍋 Clay mask once a week
🚿 BHA toner to control oil
🚫 Avoid heavy creams and oils

💡 Oily skin is great at preventing wrinkles!"""

        elif any(word in last_message for word in ['dry', 'flaky', 'tight', 'rough']):
            reply = """💧 Dry Skin Treatment:

🧴 Use cream cleanser (not foaming)
💦 Apply hyaluronic acid on damp skin
🧴 Heavy ceramide moisturizer twice daily
🚿 Lukewarm showers only (not hot)
☀️ Hydrating SPF 30 sunscreen
🥗 Eat avocado, nuts and fish

💊 CeraVe moisturizing cream works great!"""

        elif any(word in last_message for word in ['sunburn', 'tan', 'tanning', 'dark']):
            reply = """☀️ Sun Damage & Tanning:

🌿 Apply aloe vera gel immediately
☀️ SPF 50+ sunscreen every 2 hours
🧴 Use kojic acid cream for de-tanning
💊 Vitamin C serum every morning
🚫 Avoid sun between 11am - 4pm

⏰ Results visible in 4-6 weeks with consistent care."""

        elif any(word in last_message for word in ['diet', 'food', 'eat', 'drink', 'nutrition']):
            reply = """🥗 Best Foods for Glowing Skin:

✅ Eat more:
🍅 Tomatoes
🥑 Avocado
🫐 Blueberries
🐟 Salmon
🥦 Broccoli
💧 3-4 litres water daily

❌ Avoid:
🍕 Oily junk food
🍬 Excess sugar
🥛 Too much dairy"""

        elif any(word in last_message for word in ['emergency', 'severe', 'urgent', 'spreading', 'blister', 'rash']):
            reply = """🚨 This sounds serious!

1️⃣ Do NOT scratch or touch the area
2️⃣ Take a clear photo of the affected skin
3️⃣ Use the DermIQ Analyze feature
4️⃣ Visit Emergency page for nearby doctors

⚠️ Go to emergency if you have:
- Rapidly spreading rash
- Difficulty breathing
- Severe swelling
- High fever with skin symptoms

🏥 Please see a dermatologist immediately!"""

        elif any(word in last_message for word in ['routine', 'skincare', 'regimen', 'steps']):
            reply = """🌟 Basic Skincare Routine:

☀️ Morning:
1. Gentle cleanser
2. Vitamin C serum
3. Moisturizer
4. SPF 50+ sunscreen

🌙 Night:
1. Double cleanse
2. Toner
3. Retinol or Niacinamide serum
4. Heavy moisturizer

💡 Consistency is key — results in 4-8 weeks!"""

        elif any(word in last_message for word in ['medicine', 'product', 'recommend', 'suggest', 'buy']):
            reply = """💊 Recommended OTC Products:

For Acne:
- Benzoyl Peroxide 2.5%
- Salicylic Acid 2% wash
- Niacinamide 10% serum

For Dark Spots:
- Vitamin C serum
- Alpha Arbutin
- Kojic Acid cream

For Hydration:
- Hyaluronic Acid serum
- CeraVe Moisturizer
- Cetaphil cleanser

⚠️ Always consult a dermatologist before starting new products."""

        else:
            reply = """👋 I am DermIQ's AI Skin Assistant!

I can help you with:
🧴 Skincare routines
🥗 Diet tips for healthy skin
💊 OTC medicine guidance
🚨 Emergency skin help
☀️ Sun protection advice

Try asking me:
- How to treat acne?
- Best foods for glowing skin?
- My skin is very dry, help!
- What is a good skincare routine?"""

        return jsonify({'success': True, 'reply': reply}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'reply'  : 'Sorry, something went wrong. Please try again!'
        }), 500