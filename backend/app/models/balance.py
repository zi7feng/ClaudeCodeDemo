from datetime import datetime
from . import db


class Balance(db.Model):
    """Balance model for storing user's current balance."""
    __tablename__ = 'balance'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    balance = db.Column(db.Numeric(15, 2), nullable=False, default=0.00)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert balance record to dictionary."""
        return {
            'id': self.id,
            'userId': self.userId,
            'balance': float(self.balance) if self.balance else 0.00,
            'updatedAt': self.updatedAt.isoformat() if self.updatedAt else None,
        }

    def __repr__(self):
        return f'<Balance User:{self.userId} Balance:{self.balance}>'
