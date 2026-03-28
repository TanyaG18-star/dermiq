# routes/emergency_routes.py
# Returns dermatologist list based on user city

from flask import Blueprint, request, jsonify

# Create blueprint
emergency = Blueprint('emergency', __name__)

# Static doctor data by city
DOCTORS = {
    'Jabalpur': [
        {'name': 'Dr. Priya Sharma',  'hospital': 'Narmada Skin Clinic', 'contact': '0761-2345678', 'address': 'Napier Town, Jabalpur'},
        {'name': 'Dr. Rakesh Verma',  'hospital': 'Skin Care Centre',    'contact': '0761-3456789', 'address': 'Wright Town, Jabalpur'},
        {'name': 'Dr. Sunita Patel',  'hospital': 'DermaCare Hospital',  'contact': '0761-4567890', 'address': 'Civil Lines, Jabalpur'},
        {'name': 'Dr. Sachin Luthra', 'hospital': 'Luthra Skin Clinic',  'contact': '0761-5678901', 'address': 'Napier Town, Jabalpur'},
    ],
    'Mumbai': [
        {'name': 'Dr. Anil Mehta',    'hospital': 'Skin Plus Clinic',    'contact': '022-12345678', 'address': 'Bandra, Mumbai'},
        {'name': 'Dr. Riya Shah',     'hospital': 'DermaCare Mumbai',    'contact': '022-23456789', 'address': 'Andheri, Mumbai'},
    ],
    'Delhi': [
        {'name': 'Dr. Vikram Singh',  'hospital': 'Delhi Skin Centre',   'contact': '011-12345678', 'address': 'Connaught Place, Delhi'},
        {'name': 'Dr. Meena Gupta',   'hospital': 'Capital Derma Clinic','contact': '011-23456789', 'address': 'Lajpat Nagar, Delhi'},
    ],
    'Default': [
        {'name': 'Dr. Rajesh Kumar',  'hospital': 'City Skin Clinic',     'contact': '1800-000-0000', 'address': 'Your nearest hospital'},
        {'name': 'Dr. Anita Singh',   'hospital': 'National Derma Centre','contact': '1800-111-1111', 'address': 'Your nearest hospital'},
    ],
}

# ─────────────────────────────
# POST /emergency
# ─────────────────────────────
@emergency.route('/emergency', methods=['POST'])
def get_doctors():
    try:
        data = request.get_json()
        city = data.get('city', 'Default')

        # Get doctors for city or default
        doctors = DOCTORS.get(city, DOCTORS['Default'])

        return jsonify({
            'success': True,
            'city':    city,
            'doctors': doctors
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500