# routes/auth_routes.py
# Handles user registration and login

from flask import Blueprint, request, jsonify
from database.db import db
from models.user_model import User

# Create blueprint
auth = Blueprint('auth', __name__)

# ─────────────────────────────
# POST /register
# ─────────────────────────────
@auth.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Check if email already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Email already registered!'}), 400

        # Create new user
        new_user = User(
            fullName = data['fullName'],
            age      = data['age'],
            gender   = data['gender'],
            contact  = data['contact'],
            email    = data['email'],
            city     = data['city'],
            password = data['password']
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

        # Find user by email
        user = User.query.filter_by(email=data['email']).first()

        if not user:
            return jsonify({'success': False, 'message': 'User not found!'}), 404

        # Check password
        if user.password != data['password']:
            return jsonify({'success': False, 'message': 'Wrong password!'}), 401

        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500