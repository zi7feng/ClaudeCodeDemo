from datetime import datetime
from . import db


class BalanceHistory(db.Model):
    """Historical balance snapshots for charting."""
    __tablename__ = 'balance_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    balance = db.Column(db.Numeric(15, 2), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    reason = db.Column(db.String(20))  # 'recharge', 'trade', 'snapshot'
    relatedId = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'timestamp': self.timestamp.isoformat(),
            'balance': float(self.balance),
        }
