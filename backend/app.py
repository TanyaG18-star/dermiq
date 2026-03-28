# app.py
# Main entry point for DermIQ Flask Backend

from flask import Flask
from flask_cors import CORS
from config import Config
from database.db import init_db

# Import routes
from routes.auth_routes import auth
from routes.analysis_routes import analysis
from routes.emergency_routes import emergency

def create_app():
    # Create Flask app
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(Config)
    
    # Enable CORS so React can talk to Flask
    CORS(app)
    
    # Initialize database
    init_db(app)
    
    # Register blueprints (routes)
    app.register_blueprint(auth)
    app.register_blueprint(analysis)
    app.register_blueprint(emergency)
    
    return app

# ─────────────────────────────
# Run the app
# ─────────────────────────────
if __name__ == '__main__':
    app = create_app()
    print("🚀 DermIQ Backend Running on http://localhost:5000")
    app.run(debug=True, port=5000)