from datetime import date, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd

from ..models import Price, User


class ChartService:
    """Service for generating chart data with moving averages."""

    PERIOD_DAYS = {
        '1W': 7,
        '2W': 14,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        'All': None,
    }

    STATS_PERIODS = {
        '1w': 7,
        '1m': 30,
        '3m': 90,
        '6m': 180,
    }

    @staticmethod
    def get_price_chart_data(
        seller_id: int,
        period: str = '1M'
    ) -> List[Dict[str, Any]]:
        """
        Get price data with moving averages for charting.

        Args:
            seller_id: The seller's user ID
            period: Time period ('1W', '2W', '1M', '3M', '6M', '1Y', 'All')

        Returns:
            List of dictionaries with date, session, price, and moving averages
        """
        # Validate period
        if period not in ChartService.PERIOD_DAYS:
            period = '1M'

        # Calculate start date
        days = ChartService.PERIOD_DAYS[period]
        if days:
            start_date = date.today() - timedelta(days=days)
            # Get extra data for MA calculations
            extended_start = start_date - timedelta(days=50)
            prices = Price.query.filter(
                Price.sellerId == seller_id,
                Price.date >= extended_start
            ).order_by(Price.date, Price.session).all()
        else:
            prices = Price.query.filter_by(sellerId=seller_id)\
                .order_by(Price.date, Price.session).all()
            start_date = None

        if not prices:
            return []

        # Convert to pandas DataFrame
        data = []
        for p in prices:
            data.append({
                'date': p.date.isoformat(),
                'session': p.session,
                'price': float(p.price),
                'datetime': pd.Timestamp(p.date) + (
                    pd.Timedelta(hours=9) if p.session == 'AM'
                    else pd.Timedelta(hours=14)
                )
            })

        df = pd.DataFrame(data)
        df = df.sort_values('datetime').reset_index(drop=True)

        # Calculate moving averages
        df['ma5'] = df['price'].rolling(window=5, min_periods=1).mean().round(2)
        df['ma10'] = df['price'].rolling(window=10, min_periods=1).mean().round(2)
        df['ma20'] = df['price'].rolling(window=20, min_periods=1).mean().round(2)
        df['ma50'] = df['price'].rolling(window=50, min_periods=1).mean().round(2)

        # Filter to requested period
        if start_date:
            df = df[df['date'] >= start_date.isoformat()]

        # Convert to list of dicts
        result = []
        for _, row in df.iterrows():
            result.append({
                'date': row['date'],
                'session': row['session'],
                'price': row['price'],
                'ma5': row['ma5'],
                'ma10': row['ma10'],
                'ma20': row['ma20'],
                'ma50': row['ma50'],
            })

        return result

    @staticmethod
    def get_price_stats(seller_id: int) -> Dict[str, Any]:
        """
        Get price statistics for a seller.

        Calculates:
            - lastSalePrice: Most recent price
            - 1wHigh/1wLow: Past week high/low
            - 1mHigh/1mLow: Past month high/low
            - 3mHigh/3mLow: Past 3 months high/low
            - 6mHigh/6mLow: Past 6 months high/low

        Args:
            seller_id: The seller's user ID

        Returns:
            Dictionary with price statistics
        """
        # Get the latest price
        latest_price = Price.query.filter_by(sellerId=seller_id)\
            .order_by(Price.date.desc(), Price.session.desc())\
            .first()

        result: Dict[str, Any] = {
            'lastSalePrice': float(latest_price.price) if latest_price else None,
        }

        # Calculate high/low for each period
        for period_key, days in ChartService.STATS_PERIODS.items():
            start_date = date.today() - timedelta(days=days)

            prices = Price.query.filter(
                Price.sellerId == seller_id,
                Price.date >= start_date
            ).all()

            if prices:
                price_values = [float(p.price) for p in prices]
                result[f'{period_key}High'] = max(price_values)
                result[f'{period_key}Low'] = min(price_values)
            else:
                result[f'{period_key}High'] = None
                result[f'{period_key}Low'] = None

        return result

    @staticmethod
    def get_all_sellers_with_latest_price(search: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all sellers with their latest price.

        Args:
            search: Optional search string for fuzzy matching on username

        Returns:
            List of seller data with latest price
        """
        query = User.query.filter_by(role='seller')
        if search:
            query = query.filter(User.username.ilike(f'%{search}%'))
        sellers = query.all()
        result = []

        for seller in sellers:
            latest_price = Price.query.filter_by(sellerId=seller.id)\
                .order_by(Price.date.desc(), Price.session.desc())\
                .first()

            result.append({
                'id': seller.id,
                'username': seller.username,
                'latestPrice': latest_price.to_dict() if latest_price else None,
            })

        return result
