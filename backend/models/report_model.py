# models/report_model.py
# This file defines the Report table in the database

from database.db import db
from datetime import datetime

class Report(db.Model):
    # Table name
    __tablename__ = 'reports'

    # Columns
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    condition      = db.Column(db.String(100), nullable=False)
    severity       = db.Column(db.String(50), nullable=False)
    confidence     = db.Column(db.Float, nullable=False)
    risk_score     = db.Column(db.Integer, default=0)
    recommendation = db.Column(db.Text, nullable=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert report object to dictionary for JSON response"""
        return {
            'id':             self.id,
            'user_id':        self.user_id,
            'condition':      self.condition,
            'severity':       self.severity,
            'confidence':     self.confidence,
            'risk_score':     self.risk_score,
            'recommendation': self.recommendation,
            'created_at':     self.created_at.strftime('%Y-%m-%d %H:%M')
        }