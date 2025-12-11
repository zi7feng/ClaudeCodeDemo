from datetime import datetime
from . import db


class Price(db.Model):
    """Price model for storing seller's daily prices."""
    __tablename__ = 'price'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sellerId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    session = db.Column(db.Enum('AM', 'PM', name='price_session'), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('sellerId', 'date', 'session', name='unique_seller_date_session'),
    )

    def to_dict(self):
        """Convert price record to dictionary."""
        return {
            'id': self.id,
            'sellerId': self.sellerId,
            'date': self.date.isoformat() if self.date else None,
            'session': self.session,
            'price': float(self.price) if self.price else None,
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
        }

    def __repr__(self):
        return f'<Price {self.sellerId} {self.date} {self.session}: {self.price}>'
