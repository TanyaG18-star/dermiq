# database/db.py
# This file sets up the SQLAlchemy database instance

from flask_sqlalchemy import SQLAlchemy

# Create database instance
db = SQLAlchemy()

def init_db(app):
    """Initialize database with Flask app"""
    db.init_app(app)
    with app.app_context():
        db.create_all()
        print("✅ Database initialized successfully!")