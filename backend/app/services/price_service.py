from datetime import date
from typing import Optional

from sqlalchemy.exc import IntegrityError

from ..models import db, Price, User


class PriceService:
    """Service for managing price records."""

    @staticmethod
    def upload_price(
        seller_id: int,
        price_date: date,
        session_type: str,
        price: float
    ) -> Price:
        """
        Upload or update a price record.

        Args:
            seller_id: The seller's user ID
            price_date: The date for the price
            session_type: 'AM' or 'PM'
            price: The price value

        Returns:
            The created or updated Price record

        Raises:
            ValueError: If validation fails
        """
        # Validate session type
        if session_type not in ('AM', 'PM'):
            raise ValueError('Session must be AM or PM')

        # Validate price
        if price <= 0:
            raise ValueError('Price must be positive')

        # Check if seller exists and is a seller
        seller = User.query.get(seller_id)
        if not seller:
            raise ValueError('Seller not found')
        if seller.role != 'seller':
            raise ValueError('User is not a seller')

        # Check for existing record
        existing = Price.query.filter_by(
            sellerId=seller_id,
            date=price_date,
            session=session_type
        ).first()

        if existing:
            # Update existing record
            existing.price = price
            db.session.commit()
            return existing
        else:
            # Create new record with concurrency handling
            try:
                price_record = Price(
                    sellerId=seller_id,
                    date=price_date,
                    session=session_type,
                    price=price
                )
                db.session.add(price_record)
                db.session.commit()
                return price_record
            except IntegrityError:
                db.session.rollback()
                # Concurrent insert occurred, fetch and update the existing record
                existing = Price.query.filter_by(
                    sellerId=seller_id,
                    date=price_date,
                    session=session_type
                ).first()
                if existing:
                    existing.price = price
                    db.session.commit()
                    return existing
                else:
                    raise

    @staticmethod
    def get_latest_price(seller_id: int) -> Optional[Price]:
        """
        Get the latest price for a seller.

        Args:
            seller_id: The seller's user ID

        Returns:
            The latest Price record or None
        """
        return Price.query.filter_by(sellerId=seller_id)\
            .order_by(Price.date.desc(), Price.session.desc())\
            .first()

    @staticmethod
    def get_prices_by_seller(seller_id: int, limit: int = 100) -> list:
        """
        Get price history for a seller.

        Args:
            seller_id: The seller's user ID
            limit: Maximum number of records to return

        Returns:
            List of Price records
        """
        return Price.query.filter_by(sellerId=seller_id)\
            .order_by(Price.date.desc(), Price.session.desc())\
            .limit(limit)\
            .all()

    @staticmethod
    def get_filled_sessions(seller_id: int, query_date: date) -> list:
        """
        Get list of sessions that have already been filled for a specific date.

        Args:
            seller_id: The seller's user ID
            query_date: The date to check

        Returns:
            List of session types ('AM', 'PM') that have been filled
        """
        prices = Price.query.filter_by(
            sellerId=seller_id,
            date=query_date
        ).all()
        return [p.session for p in prices]
