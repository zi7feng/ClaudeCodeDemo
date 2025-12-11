from datetime import datetime
from . import db


class Recharge(db.Model):
    """Recharge model for storing deposit records."""
    __tablename__ = 'recharge'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert recharge record to dictionary."""
        return {
            'id': self.id,
            'userId': self.userId,
            'amount': float(self.amount) if self.amount else 0.00,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self):
        return f'<Recharge User:{self.userId} Amount:{self.amount}>'
