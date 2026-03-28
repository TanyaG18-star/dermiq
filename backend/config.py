# config.py
# All configuration settings for the Flask app

import os

class Config:
    # Secret key for session security
    SECRET_KEY = 'dermiq-secret-key-2024'
    
    # SQLite database location
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dermiq.db'
    
    # Disable modification tracking (saves memory)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Debug mode
    DEBUG = True