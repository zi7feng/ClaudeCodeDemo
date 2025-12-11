from datetime import datetime
from . import db


class AccountValueHistory(db.Model):
    """Historical account value snapshots (cash + equity) for charting."""
    __tablename__ = 'account_value_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    accountValue = db.Column(db.Numeric(15, 2), nullable=False)
    cashBalance = db.Column(db.Numeric(15, 2), nullable=False)
    equityValue = db.Column(db.Numeric(15, 2), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    reason = db.Column(db.String(20))  # 'recharge', 'trade'
    relatedId = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'timestamp': self.timestamp.isoformat(),
            'accountValue': float(self.accountValue),
            'cashBalance': float(self.cashBalance),
            'equityValue': float(self.equityValue),
        }
