from datetime import datetime
from . import db


class User(db.Model):
    """User model for buyers and sellers."""
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    passwordHash = db.Column(db.String(64), nullable=False)
    role = db.Column(db.Enum('buyer', 'seller', name='user_role'), nullable=False)
    baselineWeight = db.Column(db.Numeric(5, 2), nullable=True)
    basePrice = db.Column(db.Numeric(10, 2), nullable=True)
    kUp = db.Column(db.Numeric(10, 2), nullable=True)
    kDown = db.Column(db.Numeric(10, 2), nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    prices = db.relationship('Price', backref='seller', lazy='dynamic',
                             foreign_keys='Price.sellerId')
    balance = db.relationship('Balance', backref='user', uselist=False)
    recharges = db.relationship('Recharge', backref='user', lazy='dynamic')
    buyer_trades = db.relationship('Trade', backref='buyer', lazy='dynamic',
                                   foreign_keys='Trade.buyerId')
    seller_trades = db.relationship('Trade', backref='seller_user', lazy='dynamic',
                                    foreign_keys='Trade.sellerId')

    def to_dict(self):
        """Convert user to dictionary (excluding sensitive data)."""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'baselineWeight': float(self.baselineWeight) if self.baselineWeight else None,
            'basePrice': float(self.basePrice) if self.basePrice else None,
            'kUp': float(self.kUp) if self.kUp else None,
            'kDown': float(self.kDown) if self.kDown else None,
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
        }

    def to_public_dict(self):
        """Convert user to public dictionary for listing sellers."""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
        }

    def __repr__(self):
        return f'<User {self.username}>'
