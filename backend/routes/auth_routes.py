from flask import Blueprint, request, jsonify
from database.db import db
from models.user_model import User
import hashlib

auth = Blueprint('auth', __name__)

# ─── Helper ───
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ─────────────────────────────
# POST /register
# ─────────────────────────────
@auth.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Email already registered!'}), 400

        new_user = User(
            fullName = data['fullName'],
            age      = data['age'],
            gender   = data['gender'],
            contact  = data['contact'],
            email    = data['email'],
            city     = data['city'],
            password = hash_password(data['password'])  # ✅ hashed!
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User registered successfully!',
            'user': new_user.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─────────────────────────────
# POST /login
# ─────────────────────────────
@auth.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        user = User.query.filter_by(email=data['email']).first()

        if not user:
            return jsonify({'success': False, 'message': 'User not found!'}), 404

        # ✅ Compare hashed passwords
        if user.password != hash_password(data['password']):
            return jsonify({'success': False, 'message': 'Wrong password!'}), 401

        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500