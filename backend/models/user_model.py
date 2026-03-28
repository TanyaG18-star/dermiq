# models/user_model.py
# This file defines the User table in the database

from database.db import db

class User(db.Model):
    # Table name
    __tablename__ = 'users'

    # Columns
    id       = db.Column(db.Integer, primary_key=True)
    fullName = db.Column(db.String(100), nullable=False)
    age      = db.Column(db.Integer, nullable=False)
    gender   = db.Column(db.String(20), nullable=False)
    contact  = db.Column(db.String(20), nullable=False)
    email    = db.Column(db.String(100), unique=True, nullable=False)
    city     = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        """Convert user object to dictionary for JSON response"""
        return {
            'id':       self.id,
            'fullName': self.fullName,
            'age':      self.age,
            'gender':   self.gender,
            'contact':  self.contact,
            'email':    self.email,
            'city':     self.city
        }