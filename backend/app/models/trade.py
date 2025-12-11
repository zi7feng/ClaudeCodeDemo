from datetime import datetime
from . import db


class Trade(db.Model):
    """Trade model for storing buy/sell transactions."""
    __tablename__ = 'trade'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    buyerId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sellerId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    side = db.Column(db.Enum('buy', 'sell', name='trade_side'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert trade record to dictionary."""
        return {
            'id': self.id,
            'buyerId': self.buyerId,
            'sellerId': self.sellerId,
            'price': float(self.price) if self.price else 0.00,
            'quantity': self.quantity,
            'side': self.side,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self):
        return f'<Trade {self.side} {self.quantity}@{self.price}>'
