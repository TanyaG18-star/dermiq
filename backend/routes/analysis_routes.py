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
    'Melanoma': {
        'description': '⚠️ Melanoma risk detected. Please consult a dermatologist immediately.',
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
    'Melanocytic Nevi': {
        'description': 'Melanocytic Nevi (moles) detected. Usually benign but monitor for changes.',
        'details': {'spot': 0.70, 'pigmentation': 0.60, 'lesion': 0.30},
        'routine': [
            '👁️ Monitor moles for any size or color changes',
            '☀️ Apply SPF 50+ sunscreen daily',
            '📸 Photograph moles monthly to track changes',
            '🏥 Annual dermatologist checkup recommended',
            '🚫 Never scratch or irritate moles',
        ],
        'medicines': [
            '💊 SPF 50+ mineral sunscreen',
            '💊 No treatment needed unless changes occur',
            '🏥 Consult doctor if mole changes shape or color',
        ]
    },
    'Basal Cell Carcinoma': {
        'description': '⚠️ Basal Cell Carcinoma signs detected. Most common skin cancer — highly treatable if caught early.',
        'details': {'lesion': 0.85, 'spot': 0.65, 'vessels': 0.50},
        'routine': [
            '🏥 See a dermatologist IMMEDIATELY',
            '☀️ Apply SPF 50+ sunscreen every 2 hours',
            '🚫 Avoid sun exposure especially 11am-4pm',
            '📸 Document affected area with photos',
            '🚫 Do not attempt home treatment',
        ],
        'medicines': [
            '⚠️ Requires medical diagnosis and treatment',
            '💊 SPF 50+ mineral sunscreen',
            '🏥 Treatment decided by dermatologist',
        ]
    },
    'Actinic Keratosis': {
        'description': 'Actinic Keratosis detected. Rough scaly patches caused by sun damage — pre-cancerous, needs attention.',
        'details': {'scaling': 0.75, 'redness': 0.65, 'spot': 0.55},
        'routine': [
            '🏥 Consult a dermatologist soon',
            '☀️ Apply SPF 50+ sunscreen every 2 hours',
            '🚫 Avoid prolonged sun exposure',
            '🧴 Use gentle moisturizer on affected areas',
            '📸 Monitor and document changes',
        ],
        'medicines': [
            '💊 SPF 50+ sunscreen (most important)',
            '💊 Prescription topical treatments by doctor',
            '🏥 Do not self-medicate',
        ]
    },
    'Benign Keratosis': {
        'description': 'Benign Keratosis detected. Non-cancerous skin growths — harmless but can be cosmetically treated.',
        'details': {'scaling': 0.70, 'pigmentation': 0.60, 'spot': 0.50},
        'routine': [
            '🧴 Keep skin moisturized daily',
            '☀️ Use SPF 30+ sunscreen every morning',
            '🚫 Do not pick or scratch growths',
            '💧 Drink 8 glasses of water daily',
            '🏥 Optional cosmetic removal by dermatologist',
        ],
        'medicines': [
            '💊 Gentle moisturizing cream',
            '💊 SPF 30+ sunscreen',
            '🏥 Consult doctor for removal options',
        ]
    },
    'Dermatofibroma': {
        'description': 'Dermatofibroma detected. Harmless skin nodules — common and benign.',
        'details': {'spot': 0.65, 'lesion': 0.45, 'inflammation': 0.30},
        'routine': [
            '✅ Generally harmless — no treatment needed',
            '🧴 Keep skin moisturized',
            '☀️ Apply SPF 30+ sunscreen daily',
            '🚫 Do not pick or scratch',
            '🏥 See doctor if painful or growing fast',
        ],
        'medicines': [
            '💊 No treatment usually needed',
            '💊 Basic SPF 30 moisturizer',
            '🏥 Surgical removal if desired — consult doctor',
        ]
    },
    'Vascular Lesion': {
        'description': 'Vascular Lesion detected. Blood vessel abnormalities in skin — usually benign.',
        'details': {'vessels': 0.80, 'redness': 0.70, 'sensitivity': 0.50},
        'routine': [
            '🏥 Consult a dermatologist for evaluation',
            '☀️ Apply SPF 50+ sunscreen daily',
            '🚫 Avoid extreme temperatures',
            '🧴 Use gentle fragrance-free products',
            '📸 Monitor and document any changes',
        ],
        'medicines': [
            '💊 SPF 50+ mineral sunscreen',
            '💊 Gentle fragrance-free moisturizer',
            '🏥 Treatment options discussed with doctor',
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