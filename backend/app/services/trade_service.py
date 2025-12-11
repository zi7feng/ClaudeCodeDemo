from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import List, Dict, Any

from ..models import db, Trade, Balance, User, Price, BalanceHistory, AccountValueHistory


class TradeService:
    """Service for managing trades and balances."""

    @staticmethod
    def recharge(user_id: int, amount: float) -> Balance:
        """
        Add funds to a user's balance.

        Args:
            user_id: The user's ID
            amount: Amount to add (must be positive)

        Returns:
            Updated Balance record

        Raises:
            ValueError: If validation fails
        """
        if amount <= 0:
            raise ValueError('Amount must be positive')

        # Get or create balance record with row lock to prevent race conditions
        balance = Balance.query.filter_by(userId=user_id).with_for_update().first()
        if not balance:
            balance = Balance(userId=user_id, balance=Decimal('0.00'))
            db.session.add(balance)

        # Update balance
        balance.balance = Decimal(str(balance.balance)) + Decimal(str(amount))

        # Record recharge
        from ..models import Recharge
        recharge = Recharge(userId=user_id, amount=amount)
        db.session.add(recharge)
        db.session.flush()

        # Record balance history
        TradeService.record_balance_history(
            user_id=user_id,
            balance=balance.balance,
            reason='recharge',
            related_id=recharge.id
        )

        # Record account value history
        TradeService.record_account_value_history(
            user_id=user_id,
            reason='recharge',
            related_id=recharge.id
        )

        db.session.commit()
        return balance

    @staticmethod
    def get_balance(user_id: int) -> Decimal:
        """
        Get a user's current balance.

        Args:
            user_id: The user's ID

        Returns:
            Current balance as Decimal
        """
        balance = Balance.query.filter_by(userId=user_id).first()
        if not balance:
            return Decimal('0.00')
        return Decimal(str(balance.balance))

    @staticmethod
    def _calculate_position(buyer_id: int, seller_id: int) -> int:
        """
        Calculate current position (shares held) for a buyer with a specific seller.

        Args:
            buyer_id: The buyer's user ID
            seller_id: The seller's user ID

        Returns:
            Current position (number of shares)
        """
        trades = Trade.query.filter_by(buyerId=buyer_id, sellerId=seller_id).all()
        position = 0
        for trade in trades:
            if trade.side == 'buy':
                position += trade.quantity
            else:
                position -= trade.quantity
        return position

    @staticmethod
    def execute_trade(
        buyer_id: int,
        seller_id: int,
        price: float,
        quantity: int,
        side: str
    ) -> Trade:
        """
        Execute a buy or sell trade.

        For 'buy': buyer pays price * quantity
        For 'sell': buyer receives price * quantity

        Args:
            buyer_id: The buyer's user ID
            seller_id: The seller's user ID
            price: Price per unit
            quantity: Number of units
            side: 'buy' or 'sell'

        Returns:
            Created Trade record

        Raises:
            ValueError: If validation fails
        """
        if side not in ('buy', 'sell'):
            raise ValueError('Side must be buy or sell')
        if price <= 0:
            raise ValueError('Price must be positive')
        if quantity <= 0:
            raise ValueError('Quantity must be positive')

        # Validate users
        buyer = User.query.get(buyer_id)
        seller = User.query.get(seller_id)

        if not buyer:
            raise ValueError('Buyer not found')
        if not seller:
            raise ValueError('Seller not found')
        if seller.role != 'seller':
            raise ValueError('Target user is not a seller')

        # Get buyer's balance with row lock to prevent race conditions
        buyer_balance = Balance.query.filter_by(userId=buyer_id).with_for_update().first()
        if not buyer_balance:
            buyer_balance = Balance(userId=buyer_id, balance=Decimal('0.00'))
            db.session.add(buyer_balance)
            db.session.flush()

        # Get seller's balance with row lock
        seller_balance = Balance.query.filter_by(userId=seller_id).with_for_update().first()
        if not seller_balance:
            seller_balance = Balance(userId=seller_id, balance=Decimal('0.00'))
            db.session.add(seller_balance)
            db.session.flush()

        total_cost = Decimal(str(price)) * Decimal(str(quantity))

        if side == 'buy':
            # Buyer buys: buyer pays, seller receives
            if Decimal(str(buyer_balance.balance)) < total_cost:
                raise ValueError('Insufficient balance')
            buyer_balance.balance = Decimal(str(buyer_balance.balance)) - total_cost
            seller_balance.balance = Decimal(str(seller_balance.balance)) + total_cost
        else:
            # Buyer sells: buyer receives, seller pays out
            # First, validate buyer has enough shares to sell
            current_position = TradeService._calculate_position(buyer_id, seller_id)
            if current_position < quantity:
                raise ValueError(f'Insufficient shares. You own {current_position} shares but tried to sell {quantity}')
            buyer_balance.balance = Decimal(str(buyer_balance.balance)) + total_cost
            seller_balance.balance = Decimal(str(seller_balance.balance)) - total_cost

        # Create trade record
        trade = Trade(
            buyerId=buyer_id,
            sellerId=seller_id,
            price=price,
            quantity=quantity,
            side=side
        )
        db.session.add(trade)
        db.session.flush()

        # Record balance history for both buyer and seller
        TradeService.record_balance_history(
            user_id=buyer_id,
            balance=buyer_balance.balance,
            reason='trade',
            related_id=trade.id
        )
        TradeService.record_balance_history(
            user_id=seller_id,
            balance=seller_balance.balance,
            reason='trade',
            related_id=trade.id
        )

        # Record account value history for buyer
        TradeService.record_account_value_history(
            user_id=buyer_id,
            reason='trade',
            related_id=trade.id
        )

        db.session.commit()

        return trade

    @staticmethod
    def get_trades(
        user_id: int,
        seller_id: int = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get trade history for a buyer.

        Args:
            user_id: The buyer's user ID
            seller_id: Optional filter by seller
            limit: Maximum records to return

        Returns:
            List of trade records with seller info
        """
        query = Trade.query.filter_by(buyerId=user_id)

        if seller_id:
            query = query.filter_by(sellerId=seller_id)

        trades = query.order_by(Trade.timestamp.desc()).limit(limit).all()

        result = []
        for trade in trades:
            seller = User.query.get(trade.sellerId)
            result.append({
                **trade.to_dict(),
                'sellerName': seller.username if seller else 'Unknown',
            })

        return result

    @staticmethod
    def get_seller_trades(seller_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get trade history for a seller.

        Args:
            seller_id: The seller's user ID
            limit: Maximum records to return

        Returns:
            List of trade records with buyer info
        """
        trades = Trade.query.filter_by(sellerId=seller_id)\
            .order_by(Trade.timestamp.desc())\
            .limit(limit)\
            .all()

        result = []
        for trade in trades:
            buyer = User.query.get(trade.buyerId)
            result.append({
                **trade.to_dict(),
                'buyerName': buyer.username if buyer else 'Unknown',
            })

        return result

    @staticmethod
    def calculate_pnl(user_id: int, seller_id: int) -> Dict[str, Any]:
        """
        Calculate profit/loss for a buyer's trades with a specific seller.

        Args:
            user_id: The buyer's user ID
            seller_id: The seller's user ID

        Returns:
            Dictionary with position, cost basis, current value, and P&L
        """
        trades = Trade.query.filter_by(
            buyerId=user_id,
            sellerId=seller_id
        ).order_by(Trade.timestamp).all()

        if not trades:
            return {
                'position': 0,
                'costBasis': 0,
                'totalCost': 0,
                'currentPrice': None,
                'currentValue': 0,
                'pnl': 0,
                'pnlPercent': 0,
            }

        # Calculate position and cost basis (FIFO not implemented, using average)
        position = 0
        total_cost = Decimal('0.00')

        for trade in trades:
            if trade.side == 'buy':
                position += trade.quantity
                total_cost += Decimal(str(trade.price)) * Decimal(str(trade.quantity))
            else:
                position -= trade.quantity
                # Reduce cost proportionally
                if position > 0:
                    avg_cost = total_cost / (position + trade.quantity)
                    total_cost -= avg_cost * Decimal(str(trade.quantity))
                else:
                    total_cost = Decimal('0.00')

        # Get current price
        latest_price = Price.query.filter_by(sellerId=seller_id)\
            .order_by(Price.date.desc(), Price.session.desc())\
            .first()

        current_price = float(latest_price.price) if latest_price else 0
        current_value = position * current_price if position > 0 else 0
        cost_basis = float(total_cost / position) if position > 0 else 0

        pnl = current_value - float(total_cost) if position > 0 else 0
        pnl_percent = (pnl / float(total_cost) * 100) if float(total_cost) > 0 else 0

        return {
            'position': position,
            'costBasis': round(cost_basis, 2),
            'totalCost': round(float(total_cost), 2),
            'currentPrice': current_price,
            'currentValue': round(current_value, 2),
            'pnl': round(pnl, 2),
            'pnlPercent': round(pnl_percent, 2),
        }

    @staticmethod
    def calculate_total_pnl(buyer_id: int) -> Dict[str, Any]:
        """
        Calculate total P&L for a buyer across all sellers.

        Calculates both realized P&L (from closed positions) and
        unrealized P&L (from current open positions).

        Args:
            buyer_id: The buyer's user ID

        Returns:
            Dictionary with realized, unrealized, total P&L and return percentage
        """
        # Get all trades for this buyer
        trades = Trade.query.filter_by(buyerId=buyer_id).all()

        if not trades:
            return {
                'realizedPnl': 0,
                'unrealizedPnl': 0,
                'totalPnl': 0,
                'totalInvested': 0,
                'returnPercent': 0,
            }

        # Group trades by seller
        seller_trades: Dict[int, list] = {}
        for trade in trades:
            if trade.sellerId not in seller_trades:
                seller_trades[trade.sellerId] = []
            seller_trades[trade.sellerId].append(trade)

        total_realized_pnl = Decimal('0.00')
        total_unrealized_pnl = Decimal('0.00')
        total_invested = Decimal('0.00')

        for seller_id, seller_trade_list in seller_trades.items():
            # Sort trades by timestamp
            seller_trade_list.sort(key=lambda t: t.timestamp)

            # Track position and cost using average cost method
            position = 0
            total_cost = Decimal('0.00')
            realized_pnl = Decimal('0.00')

            for trade in seller_trade_list:
                trade_price = Decimal(str(trade.price))
                trade_qty = trade.quantity

                if trade.side == 'buy':
                    # Buying: add to position and cost
                    total_cost += trade_price * Decimal(str(trade_qty))
                    position += trade_qty
                    total_invested += trade_price * Decimal(str(trade_qty))
                else:
                    # Selling: calculate realized P&L
                    if position > 0:
                        avg_cost = total_cost / Decimal(str(position))
                        sell_value = trade_price * Decimal(str(trade_qty))
                        cost_of_sold = avg_cost * Decimal(str(trade_qty))
                        realized_pnl += sell_value - cost_of_sold

                        # Update position and remaining cost
                        position -= trade_qty
                        if position > 0:
                            total_cost -= cost_of_sold
                        else:
                            total_cost = Decimal('0.00')
                    else:
                        # No position to sell - skip this trade for P&L calculation
                        pass

            total_realized_pnl += realized_pnl

            # Calculate unrealized P&L for remaining position
            if position > 0:
                latest_price = Price.query.filter_by(sellerId=seller_id)\
                    .order_by(Price.date.desc(), Price.session.desc())\
                    .first()

                if latest_price:
                    current_price = Decimal(str(latest_price.price))
                    current_value = current_price * Decimal(str(position))
                    unrealized = current_value - total_cost
                    total_unrealized_pnl += unrealized

        total_pnl = total_realized_pnl + total_unrealized_pnl
        return_percent = (float(total_pnl) / float(total_invested) * 100) if total_invested > 0 else 0

        return {
            'realizedPnl': round(float(total_realized_pnl), 2),
            'unrealizedPnl': round(float(total_unrealized_pnl), 2),
            'totalPnl': round(float(total_pnl), 2),
            'totalInvested': round(float(total_invested), 2),
            'returnPercent': round(return_percent, 2),
        }

    @staticmethod
    def calculate_seller_earnings(seller_id: int) -> Dict[str, Any]:
        """
        Calculate earnings statistics for a seller.

        Args:
            seller_id: The seller's user ID

        Returns:
            Dictionary with total earnings from buys, total payouts from sells,
            net earnings, and transaction counts.
        """
        trades = Trade.query.filter_by(sellerId=seller_id).all()

        if not trades:
            return {
                'totalReceived': 0,
                'totalPaidOut': 0,
                'netEarnings': 0,
                'buyTransactions': 0,
                'sellTransactions': 0,
            }

        total_received = Decimal('0.00')
        total_paid_out = Decimal('0.00')
        buy_count = 0
        sell_count = 0

        for trade in trades:
            trade_value = Decimal(str(trade.price)) * Decimal(str(trade.quantity))
            if trade.side == 'buy':
                # Buyer bought from seller: seller received money
                total_received += trade_value
                buy_count += 1
            else:
                # Buyer sold to seller: seller paid out money
                total_paid_out += trade_value
                sell_count += 1

        net_earnings = total_received - total_paid_out

        return {
            'totalReceived': round(float(total_received), 2),
            'totalPaidOut': round(float(total_paid_out), 2),
            'netEarnings': round(float(net_earnings), 2),
            'buyTransactions': buy_count,
            'sellTransactions': sell_count,
        }

    @staticmethod
    def record_balance_history(
        user_id: int,
        balance: Decimal,
        reason: str,
        related_id: int = None
    ) -> BalanceHistory:
        """
        Record a balance snapshot for charting.

        Args:
            user_id: The user's ID
            balance: Current balance to record
            reason: Reason for the snapshot ('recharge', 'trade', 'snapshot')
            related_id: Optional related record ID (trade or recharge ID)

        Returns:
            Created BalanceHistory record
        """
        history = BalanceHistory(
            userId=user_id,
            balance=balance,
            timestamp=datetime.utcnow(),
            reason=reason,
            relatedId=related_id
        )
        db.session.add(history)
        return history

    @staticmethod
    def get_balance_history(user_id: int, period: str = '1M') -> List[Dict[str, Any]]:
        """
        Get balance history for charting.

        Args:
            user_id: The user's ID
            period: Time period ('1W', '2W', '1M', '3M', '6M', '1Y', 'ALL')

        Returns:
            List of balance history records
        """
        # Calculate start date based on period
        now = datetime.utcnow()
        period_map = {
            '1W': timedelta(weeks=1),
            '2W': timedelta(weeks=2),
            '1M': timedelta(days=30),
            '3M': timedelta(days=90),
            '6M': timedelta(days=180),
            '1Y': timedelta(days=365),
        }

        query = BalanceHistory.query.filter_by(userId=user_id)

        if period != 'ALL' and period in period_map:
            start_date = now - period_map[period]
            query = query.filter(BalanceHistory.timestamp >= start_date)

        history = query.order_by(BalanceHistory.timestamp.asc()).all()

        return [h.to_dict() for h in history]

    @staticmethod
    def calculate_daily_pnl(buyer_id: int) -> Dict[str, Any]:
        """
        Calculate today's P&L for a buyer.

        Args:
            buyer_id: The buyer's user ID

        Returns:
            Dictionary with today's P&L data matching DailyPnLData interface:
            - realizedPnl: Realized P&L from sells today
            - unrealizedPnl: Unrealized P&L from buys today (always 0 for daily)
            - totalPnl: Total P&L (realized + unrealized)
            - totalInvested: Total amount invested today (buy amount)
            - returnPercent: Return percentage
            - periodStart: Start of today
            - periodEnd: End of today
        """
        # Get today's date range
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # Get all trades for this buyer today
        trades = Trade.query.filter(
            Trade.buyerId == buyer_id,
            Trade.timestamp >= today_start,
            Trade.timestamp <= today_end
        ).all()

        if not trades:
            return {
                'realizedPnl': 0,
                'unrealizedPnl': 0,
                'totalPnl': 0,
                'totalInvested': 0,
                'returnPercent': 0,
                'periodStart': today_start.isoformat(),
                'periodEnd': today_end.isoformat(),
            }

        buy_amount = Decimal('0.00')
        sell_amount = Decimal('0.00')

        for trade in trades:
            trade_value = Decimal(str(trade.price)) * Decimal(str(trade.quantity))
            if trade.side == 'buy':
                buy_amount += trade_value
            else:
                sell_amount += trade_value

        # For daily P&L: realized = sell - buy (cash flow from trades)
        realized_pnl = sell_amount - buy_amount
        unrealized_pnl = Decimal('0.00')  # No unrealized for daily view
        total_pnl = realized_pnl + unrealized_pnl
        total_invested = buy_amount
        return_percent = (float(total_pnl) / float(total_invested) * 100) if total_invested > 0 else 0

        return {
            'realizedPnl': round(float(realized_pnl), 2),
            'unrealizedPnl': round(float(unrealized_pnl), 2),
            'totalPnl': round(float(total_pnl), 2),
            'totalInvested': round(float(total_invested), 2),
            'returnPercent': round(return_percent, 2),
            'periodStart': today_start.isoformat(),
            'periodEnd': today_end.isoformat(),
        }

    @staticmethod
    def calculate_daily_earnings(seller_id: int) -> Dict[str, Any]:
        """
        Calculate today's earnings for a seller.

        Args:
            seller_id: The seller's user ID

        Returns:
            Dictionary with today's earnings data matching DailyEarningsData interface:
            - totalReceived: Total received from buyer purchases today
            - totalPaidOut: Total paid out for buyer sells today
            - netEarnings: Net earnings (received - paid out)
            - buyTransactions: Number of buy transactions
            - sellTransactions: Number of sell transactions
            - periodStart: Start of today
            - periodEnd: End of today
        """
        # Get today's date range
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # Get all trades for this seller today
        trades = Trade.query.filter(
            Trade.sellerId == seller_id,
            Trade.timestamp >= today_start,
            Trade.timestamp <= today_end
        ).all()

        if not trades:
            return {
                'totalReceived': 0,
                'totalPaidOut': 0,
                'netEarnings': 0,
                'buyTransactions': 0,
                'sellTransactions': 0,
                'periodStart': today_start.isoformat(),
                'periodEnd': today_end.isoformat(),
            }

        received = Decimal('0.00')
        paid_out = Decimal('0.00')
        buy_count = 0
        sell_count = 0

        for trade in trades:
            trade_value = Decimal(str(trade.price)) * Decimal(str(trade.quantity))
            if trade.side == 'buy':
                # Buyer bought from seller: seller received money
                received += trade_value
                buy_count += 1
            else:
                # Buyer sold to seller: seller paid out money
                paid_out += trade_value
                sell_count += 1

        net_earnings = received - paid_out

        return {
            'totalReceived': round(float(received), 2),
            'totalPaidOut': round(float(paid_out), 2),
            'netEarnings': round(float(net_earnings), 2),
            'buyTransactions': buy_count,
            'sellTransactions': sell_count,
            'periodStart': today_start.isoformat(),
            'periodEnd': today_end.isoformat(),
        }

    @staticmethod
    def calculate_account_value(buyer_id: int) -> Dict[str, Any]:
        """
        Calculate the total account value for a buyer (cash + equity).

        Account value = cash balance + sum of (current_price * shares) for all positions.

        Args:
            buyer_id: The buyer's user ID

        Returns:
            Dictionary with cashBalance, equityValue, and accountValue
        """
        # Get cash balance
        cash_balance = TradeService.get_balance(buyer_id)

        # Get all positions and calculate equity value
        equity_value = Decimal('0.00')

        # Get all trades for this buyer grouped by seller
        trades = Trade.query.filter_by(buyerId=buyer_id).all()

        if trades:
            # Group trades by seller
            seller_trades: Dict[int, list] = {}
            for trade in trades:
                if trade.sellerId not in seller_trades:
                    seller_trades[trade.sellerId] = []
                seller_trades[trade.sellerId].append(trade)

            for seller_id, trade_list in seller_trades.items():
                # Sort by timestamp
                trade_list.sort(key=lambda t: t.timestamp)

                # Calculate position using average cost method
                position = 0
                for trade in trade_list:
                    if trade.side == 'buy':
                        position += trade.quantity
                    else:
                        position -= trade.quantity

                # Only count positions with shares > 0
                if position > 0:
                    # Get current price for this seller
                    latest_price = Price.query.filter_by(sellerId=seller_id)\
                        .order_by(Price.date.desc(), Price.session.desc())\
                        .first()

                    if latest_price:
                        current_price = Decimal(str(latest_price.price))
                        equity_value += current_price * Decimal(str(position))

        account_value = cash_balance + equity_value

        return {
            'cashBalance': round(float(cash_balance), 2),
            'equityValue': round(float(equity_value), 2),
            'accountValue': round(float(account_value), 2),
        }

    @staticmethod
    def record_account_value_history(
        user_id: int,
        reason: str,
        related_id: int = None
    ) -> AccountValueHistory:
        """
        Record an account value snapshot for charting.

        Args:
            user_id: The user's ID
            reason: Reason for the snapshot ('recharge', 'trade')
            related_id: Optional related record ID (trade or recharge ID)

        Returns:
            Created AccountValueHistory record
        """
        # Calculate current account value
        account_data = TradeService.calculate_account_value(user_id)

        history = AccountValueHistory(
            userId=user_id,
            accountValue=account_data['accountValue'],
            cashBalance=account_data['cashBalance'],
            equityValue=account_data['equityValue'],
            timestamp=datetime.utcnow(),
            reason=reason,
            relatedId=related_id
        )
        db.session.add(history)
        return history

    @staticmethod
    def get_account_value_history(user_id: int) -> List[Dict[str, Any]]:
        """
        Get account value history for charting.

        Args:
            user_id: The user's ID

        Returns:
            List of account value history records (all data points)
        """
        history = AccountValueHistory.query.filter_by(userId=user_id)\
            .order_by(AccountValueHistory.timestamp.asc())\
            .all()

        return [h.to_dict() for h in history]

    @staticmethod
    def get_holdings(buyer_id: int) -> List[Dict[str, Any]]:
        """
        Get all current holdings for a buyer with shares > 0.

        Args:
            buyer_id: The buyer's user ID

        Returns:
            List of holdings with position details, P&L, and seller info
        """
        # Get all trades for this buyer
        trades = Trade.query.filter_by(buyerId=buyer_id).all()

        if not trades:
            return []

        # Group trades by seller
        seller_trades: Dict[int, list] = {}
        for trade in trades:
            if trade.sellerId not in seller_trades:
                seller_trades[trade.sellerId] = []
            seller_trades[trade.sellerId].append(trade)

        holdings = []

        for seller_id, trade_list in seller_trades.items():
            # Sort by timestamp
            trade_list.sort(key=lambda t: t.timestamp)

            # Calculate position and cost basis using average cost method
            position = 0
            total_cost = Decimal('0.00')

            for trade in trade_list:
                if trade.side == 'buy':
                    position += trade.quantity
                    total_cost += Decimal(str(trade.price)) * Decimal(str(trade.quantity))
                else:
                    # Selling: reduce cost proportionally
                    if position > 0:
                        avg_cost = total_cost / Decimal(str(position))
                        position -= trade.quantity
                        if position > 0:
                            total_cost = avg_cost * Decimal(str(position))
                        else:
                            total_cost = Decimal('0.00')

            # Only include positions with shares > 0
            if position > 0:
                # Get seller info
                seller = User.query.get(seller_id)
                seller_name = seller.username if seller else 'Unknown'

                # Get current price
                latest_price = Price.query.filter_by(sellerId=seller_id)\
                    .order_by(Price.date.desc(), Price.session.desc())\
                    .first()

                current_price = float(latest_price.price) if latest_price else 0
                cost_basis = float(total_cost / Decimal(str(position))) if position > 0 else 0
                current_value = position * current_price
                pnl = current_value - float(total_cost)
                pnl_percent = (pnl / float(total_cost) * 100) if float(total_cost) > 0 else 0

                holdings.append({
                    'sellerId': seller_id,
                    'sellerName': seller_name,
                    'shares': position,
                    'currentPrice': round(current_price, 2),
                    'costBasis': round(cost_basis, 2),
                    'totalCost': round(float(total_cost), 2),
                    'currentValue': round(current_value, 2),
                    'pnl': round(pnl, 2),
                    'pnlPercent': round(pnl_percent, 2),
                })

        return holdings
