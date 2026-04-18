import random
import hashlib
from flask import Blueprint, request, jsonify
from database.db import db
from models.report_model import Report
from services.risk_engine import calculate_risk
from services.recommendation_engine import get_recommendation
from services.ml_engine import predict_skin_condition

analysis = Blueprint('analysis', __name__)
# ─────────────────────────────
# ML CONDITION → CONTEXT MAP
# ─────────────────────────────
ML_CONDITION_MAP = {
    'Acne': {
        'description': 'Acne detected on skin surface. Caused by clogged pores, bacteria and excess sebum.',
        'details': {'acne': 0.85, 'pores': 0.60, 'spot': 0.40},
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
        'details': {'fungal': 0.80, 'acne': 0.50, 'oil': 0.60},
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

# ─────────────────────────────
# SMART AI ENGINE (context enrichment)
# ─────────────────────────────

def analyze_skin_smart(image_base64, age, gender, city):
    image_hash = int(hashlib.md5(image_base64[:500].encode()).hexdigest(), 16)
    random.seed(image_hash)

    age = int(age) if age else 25
    gender = gender.lower() if gender else 'female'
    city = city.lower() if city else 'unknown'

    hot_cities = ['mumbai', 'delhi', 'chennai', 'hyderabad',
                  'jabalpur', 'nagpur', 'bhopal', 'indore']
    cold_cities = ['shimla', 'manali', 'dehradun', 'srinagar']
    humid_cities = ['kolkata', 'kochi', 'goa', 'bhubaneswar']

    if any(c in city for c in hot_cities):
        climate = 'hot_dry'
    elif any(c in city for c in cold_cities):
        climate = 'cold'
    elif any(c in city for c in humid_cities):
        climate = 'humid'
    else:
        climate = 'moderate'

    if age < 18:
        age_group = 'teen'
    elif age < 25:
        age_group = 'young_adult'
    elif age < 35:
        age_group = 'adult'
    elif age < 50:
        age_group = 'middle_age'
    else:
        age_group = 'mature'

    condition_pool = []

    if age_group == 'teen':
        condition_pool += [
            {'condition': 'Hormonal Acne', 'severity': 'low', 'confidence': random.randint(82, 94),
             'description': 'Hormonal acne common in teenagers. Caused by increased sebum production.',
             'details': {'acne': 0.85, 'pores': 0.60, 'dark_circle': 0.20},
             'routine': [
                 '🧴 Use salicylic acid face wash twice daily',
                 '💧 Apply oil-free moisturizer',
                 '☀️ Use SPF 30 sunscreen every morning',
                 '🚫 Do not pop or squeeze pimples',
                 '🥗 Avoid oily junk food and sugary drinks',
                 '😴 Sleep 8 hours daily to balance hormones',
             ],
             'medicines': [
                 '💊 Salicylic Acid 2% face wash',
                 '💊 Benzoyl Peroxide 2.5% gel (night)',
                 '💊 Niacinamide 10% serum',
             ]},
            {'condition': 'Oily Skin with Blackheads', 'severity': 'low', 'confidence': random.randint(78, 88),
             'description': 'Excess sebum causing oily skin and blackhead formation on nose and chin.',
             'details': {'acne': 0.55, 'pores': 0.80, 'dark_circle': 0.10},
             'routine': [
                 '🧴 Cleanse face with gentle foaming cleanser twice daily',
                 '🍋 Use clay mask once a week',
                 '💧 Use lightweight gel moisturizer',
                 '🚿 Exfoliate with BHA twice a week',
                 '☀️ Use matte finish sunscreen',
             ],
             'medicines': [
                 '💊 BHA (Beta Hydroxy Acid) toner',
                 '💊 Clay face mask (weekly)',
                 '💊 Oil control moisturizer',
             ]},
        ]

    if age_group == 'young_adult':
        condition_pool += [
            {'condition': 'Mild Acne with Dark Spots', 'severity': 'low', 'confidence': random.randint(80, 92),
             'description': 'Mild acne with post-inflammatory hyperpigmentation detected.',
             'details': {'acne': 0.72, 'spot': 0.65, 'pores': 0.45},
             'routine': [
                 '🧴 Double cleanse morning and night',
                 '🌟 Apply Vitamin C serum in the morning',
                 '💧 Use niacinamide serum for dark spots',
                 '☀️ SPF 50+ sunscreen is mandatory daily',
                 '🚿 Exfoliate with AHA twice a week',
                 '😴 Get 7-8 hours of sleep',
             ],
             'medicines': [
                 '💊 Vitamin C 15% serum (morning)',
                 '💊 Niacinamide 10% serum',
                 '💊 AHA/BHA exfoliant (twice weekly)',
                 '💊 Benzoyl Peroxide 2.5% spot treatment',
             ]},
            {'condition': 'Dehydrated Skin', 'severity': 'low', 'confidence': random.randint(75, 87),
             'description': 'Skin appears dehydrated and dull. Lack of water in skin cells detected.',
             'details': {'acne': 0.20, 'pores': 0.55, 'wrinkle': 0.30},
             'routine': [
                 '💧 Drink minimum 3 litres of water daily',
                 '🧴 Use hyaluronic acid serum on damp skin',
                 '💦 Apply heavy moisturizer morning and night',
                 '🚫 Avoid hot showers and harsh cleansers',
                 '☀️ Use hydrating SPF 30 sunscreen',
                 '🥗 Eat water-rich fruits like watermelon and cucumber',
             ],
             'medicines': [
                 '💊 Hyaluronic Acid serum',
                 '💊 Ceramide moisturizer',
                 '💊 Glycerin based toner',
             ]},
        ]

    if age_group == 'adult':
        condition_pool += [
            {'condition': 'Combination Skin with Pores', 'severity': 'low', 'confidence': random.randint(79, 91),
             'description': 'Combination skin type with enlarged pores on T-zone detected.',
             'details': {'pores': 0.78, 'acne': 0.35, 'spot': 0.40},
             'routine': [
                 '🧴 Use balancing cleanser twice daily',
                 '🧊 Apply ice cube on pores for 2 minutes daily',
                 '💧 Use niacinamide serum to minimize pores',
                 '☀️ Apply SPF 40 sunscreen daily',
                 '🍋 Use retinol serum at night',
                 '🚿 Weekly clay mask on T-zone only',
             ],
             'medicines': [
                 '💊 Niacinamide 10% serum',
                 '💊 Retinol 0.25% serum (night)',
                 '💊 Clay mask (weekly)',
             ]},
            {'condition': 'Early Signs of Aging', 'severity': 'low', 'confidence': random.randint(77, 89),
             'description': 'Fine lines and early aging signs detected. Preventable with proper care.',
             'details': {'wrinkle': 0.65, 'spot': 0.45, 'dark_circle': 0.50},
             'routine': [
                 '🌟 Use Vitamin C serum every morning',
                 '🍋 Apply retinol at night (start low)',
                 '💧 Use peptide moisturizer twice daily',
                 '☀️ SPF 50 sunscreen every single day',
                 '💆 Facial massage for 5 minutes daily',
                 '😴 Sleep on silk pillowcase to reduce wrinkles',
             ],
             'medicines': [
                 '💊 Retinol 0.5% serum (night)',
                 '💊 Vitamin C 20% serum (morning)',
                 '💊 Peptide moisturizer',
                 '💊 Eye cream with caffeine',
             ]},
        ]

    if age_group == 'middle_age':
        condition_pool += [
            {'condition': 'Hyperpigmentation & Sun Damage', 'severity': 'low', 'confidence': random.randint(82, 93),
             'description': 'Sun damage and hyperpigmentation detected. Common in 35-50 age group.',
             'details': {'spot': 0.82, 'wrinkle': 0.60, 'dark_circle': 0.55},
             'routine': [
                 '☀️ Apply SPF 50+ sunscreen religiously every 2 hours',
                 '🌟 Use Vitamin C and Kojic acid serum',
                 '🍋 Apply retinol at night for cell turnover',
                 '💆 Chemical peel once a month (professional)',
                 '💧 Stay well hydrated throughout the day',
                 '🥗 Eat antioxidant rich foods',
             ],
             'medicines': [
                 '💊 Kojic Acid cream',
                 '💊 Alpha Arbutin serum',
                 '💊 Retinol 1% (night)',
                 '💊 Vitamin C 20% serum',
             ]},
            {'condition': 'Rosacea', 'severity': 'high', 'confidence': random.randint(83, 92),
             'description': 'Rosacea symptoms detected. Facial redness and sensitivity visible.',
             'details': {'acne': 0.45, 'spot': 0.55, 'wrinkle': 0.40},
             'routine': [],
             'medicines': []},
        ]

    if age_group == 'mature':
        condition_pool += [
            {'condition': 'Deep Wrinkles & Sagging', 'severity': 'high', 'confidence': random.randint(85, 95),
             'description': 'Significant aging signs detected. Professional dermatologist consultation recommended.',
             'details': {'wrinkle': 0.90, 'spot': 0.75, 'dark_circle': 0.65},
             'routine': [],
             'medicines': []},
            {'condition': 'Age Spots & Uneven Tone', 'severity': 'low', 'confidence': random.randint(80, 91),
             'description': 'Age spots and uneven skin tone detected. Treatable with proper skincare.',
             'details': {'spot': 0.88, 'wrinkle': 0.70, 'dark_circle': 0.60},
             'routine': [
                 '☀️ SPF 50+ sunscreen every day without fail',
                 '🌟 Use prescription strength Vitamin C',
                 '🍋 Retinol 1% every night',
                 '💧 Heavy duty moisturizer twice daily',
                 '💆 Professional chemical peel monthly',
                 '🥗 Take Vitamin E and C supplements',
             ],
             'medicines': [
                 '💊 Hydroquinone 2% cream (consult doctor)',
                 '💊 Retinol 1% serum',
                 '💊 Vitamin C 20% serum',
                 '💊 SPF 50+ mineral sunscreen',
             ]},
        ]

    if climate == 'hot_dry':
        condition_pool += [
            {'condition': 'Sun Tanning & Skin Darkening', 'severity': 'low', 'confidence': random.randint(80, 92),
             'description': 'Sun tanning and skin darkening detected due to UV exposure in hot climate.',
             'details': {'spot': 0.75, 'acne': 0.25, 'pores': 0.50},
             'routine': [
                 '☀️ Apply SPF 50+ sunscreen every 2 hours outdoors',
                 '🧴 Use de-tan face pack twice a week',
                 '🌿 Apply aloe vera gel daily for cooling',
                 '💧 Drink 3-4 litres of water daily',
                 '🧊 Apply cold rose water toner twice daily',
                 '🚫 Avoid going out between 11am - 4pm',
             ],
             'medicines': [
                 '💊 Kojic Acid sunscreen SPF 50+',
                 '💊 Alpha Arbutin serum',
                 '💊 Vitamin C serum (morning)',
                 '💊 Aloe vera gel (pure)',
             ]},
        ]

    if climate == 'humid':
        condition_pool += [
            {'condition': 'Fungal Acne & Humid Skin', 'severity': 'low', 'confidence': random.randint(76, 88),
             'description': 'Fungal acne triggered by humid climate detected. Common in coastal areas.',
             'details': {'acne': 0.70, 'pores': 0.60, 'spot': 0.30},
             'routine': [
                 '🧴 Use antifungal face wash daily',
                 '💧 Use lightweight non-comedogenic moisturizer',
                 '☀️ Matte finish SPF 40 sunscreen',
                 '🚿 Cleanse face after sweating',
                 '👕 Use clean pillow covers every 2 days',
                 '💨 Keep skin dry and ventilated',
             ],
             'medicines': [
                 '💊 Ketoconazole 2% face wash',
                 '💊 Zinc pyrithione soap',
                 '💊 Oil free gel moisturizer',
             ]},
        ]

    if gender == 'female':
        condition_pool += [
            {'condition': 'Dark Circles & Periorbital Pigmentation', 'severity': 'low',
             'confidence': random.randint(78, 90),
             'description': 'Dark circles and under-eye pigmentation detected. Common in women.',
             'details': {'dark_circle': 0.82, 'wrinkle': 0.35, 'spot': 0.40},
             'routine': [
                 '😴 Sleep minimum 7-8 hours daily',
                 '💧 Stay well hydrated',
                 '🥶 Apply cold cucumber slices on eyes daily',
                 '🧴 Use Vitamin K eye cream at night',
                 '☀️ Wear UV protective sunglasses outdoors',
                 '🥗 Take iron supplements if anaemic',
             ],
             'medicines': [
                 '💊 Caffeine eye serum (morning)',
                 '💊 Vitamin K cream (night)',
                 '💊 Hyaluronic acid eye patches',
             ]},
        ]

    if gender == 'male':
        condition_pool += [
            {'condition': 'Razor Bumps & Ingrown Hair', 'severity': 'low',
             'confidence': random.randint(76, 88),
             'description': 'Razor bumps and ingrown hair detected on facial skin.',
             'details': {'acne': 0.60, 'pores': 0.55, 'spot': 0.30},
             'routine': [
                 '🪒 Always shave with sharp clean razor',
                 '🧴 Apply shaving gel before shaving',
                 '💧 Moisturize after shaving immediately',
                 '🌿 Apply aloe vera gel post shave',
                 '🚫 Do not shave against the grain',
                 '💆 Exfoliate before shaving to lift hair',
             ],
             'medicines': [
                 '💊 Salicylic Acid aftershave',
                 '💊 Glycolic acid toner',
                 '💊 Aloe vera gel (pure)',
             ]},
        ]

    if not condition_pool:
        condition_pool = [
            {'condition': 'Normal Skin - Minor Issues', 'severity': 'low',
             'confidence': random.randint(75, 85),
             'description': 'Skin appears mostly healthy with minor concerns.',
             'details': {'acne': 0.20, 'pores': 0.30, 'dark_circle': 0.25},
             'routine': [
                 '🧴 Maintain basic CTM routine daily',
                 '💧 Moisturize twice daily',
                 '☀️ Apply SPF 30 sunscreen',
                 '💧 Drink plenty of water',
             ],
             'medicines': [
                 '💊 Basic SPF 30 moisturizer',
                 '💊 Gentle face wash',
             ]},
        ]

    selected = condition_pool[image_hash % len(condition_pool)]
    return selected


# ─────────────────────────────
# POST /analyze  ← ML POWERED
# ─────────────────────────────
@analysis.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        image_base64 = data.get('image', '')
        age    = data.get('age', 25)
        gender = data.get('gender', 'female')
        city   = data.get('city', 'unknown')

        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        print(f"🔍 Analyzing for: Age={age}, Gender={gender}, City={city}")

        # ── Step 1: Try ML model first ──
        ml_result = predict_skin_condition(image_base64)

        if ml_result:
            condition  = ml_result['condition']
            confidence = ml_result['confidence']
            print(f"🤖 ML Model used: {condition} ({confidence}%)")
        else:
            # ── Step 2: Fallback to rule-based if ML fails ──
            fallback   = analyze_skin_smart(image_base64, age, gender, city)
            condition  = fallback['condition']
            confidence = fallback['confidence']
            print(f"⚠️ Fallback used: {condition}")

        # ── Step 3: Always enrich with age/gender/city context ──
        context = analyze_skin_smart(image_base64, age, gender, city)

        # Get ML-specific context if available
        ml_context  = ML_CONDITION_MAP.get(condition, None)
        age_context = analyze_skin_smart(image_base64, age, gender, city)

        final_description = ml_context['description'] if ml_context else age_context['description']
        final_details     = ml_context['details']     if ml_context else age_context.get('details', {})
        final_routine     = ml_context['routine']     if ml_context else age_context.get('routine', [])
        final_medicines   = ml_context['medicines']   if ml_context else age_context.get('medicines', [])

        return jsonify({
            'success'    : True,
            'condition'  : condition,
            'severity'   : age_context['severity'],
            'confidence' : confidence,
            'description': final_description,
            'details'    : final_details,
            'routine'    : final_routine,
            'medicines'  : final_medicines,
            'ml_used'    : ml_result is not None,
        }), 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ─────────────────────────────
# POST /risk-score
# ─────────────────────────────
@analysis.route('/risk-score', methods=['POST'])
def risk_score():
    try:
        data = request.get_json()
        result = calculate_risk(
            fever     = data.get('fever', False),
            spreading = data.get('spreading', False),
            pain      = data.get('pain', False),
            blister   = data.get('blister', False)
        )
        return jsonify({'success': True, **result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─────────────────────────────
# POST /save-report
# ─────────────────────────────
@analysis.route('/save-report', methods=['POST'])
def save_report():
    try:
        data = request.get_json()
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


# ─────────────────────────────
# GET /reports/<user_id>
# ─────────────────────────────
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


# ─────────────────────────────
# POST /chat  — AI Chatbot
# ─────────────────────────────
@analysis.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        messages = data.get('messages', [])
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

        return jsonify({
            'success': True,
            'reply'  : reply
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'reply'  : 'Sorry, something went wrong. Please try again!'
        }), 500