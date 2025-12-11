from flask import Blueprint, request, jsonify, g

from ..middlewares.auth import login_required, role_required
from ..services.trade_service import TradeService
from .. import limiter

buyer_bp = Blueprint('buyer', __name__)


@buyer_bp.route('/recharge', methods=['POST'])
@limiter.limit("5 per minute")
@login_required
@role_required('buyer')
def recharge():
    """
    Add funds to the authenticated buyer's account.

    Request body:
        - amount: number (required, must be positive)

    Returns:
        - 200: Recharge successful
        - 400: Invalid input
        - 401: Not authenticated
        - 403: Not a buyer
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    amount = data.get('amount')
    if amount is None:
        return jsonify({'error': 'Amount is required'}), 400

    try:
        amount = float(amount)
        balance = TradeService.recharge(g.user.id, amount)
        return jsonify({
            'message': 'Recharge successful',
            'balance': balance.to_dict(),
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@buyer_bp.route('/trade', methods=['POST'])
@limiter.limit("10 per minute")
@login_required
@role_required('buyer')
def trade():
    """
    Execute a buy or sell trade.

    Request body:
        - sellerId: number (required)
        - price: number (required)
        - quantity: number (required)
        - side: 'buy' | 'sell' (required)

    Returns:
        - 200: Trade executed
        - 400: Invalid input or insufficient balance
        - 401: Not authenticated
        - 403: Not a buyer
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    seller_id = data.get('sellerId')
    price = data.get('price')
    quantity = data.get('quantity')
    side = data.get('side')

    # Validate required fields
    if seller_id is None:
        return jsonify({'error': 'Seller ID is required'}), 400
    if price is None:
        return jsonify({'error': 'Price is required'}), 400
    if quantity is None:
        return jsonify({'error': 'Quantity is required'}), 400
    if not side:
        return jsonify({'error': 'Side is required'}), 400

    try:
        trade_record = TradeService.execute_trade(
            buyer_id=g.user.id,
            seller_id=int(seller_id),
            price=float(price),
            quantity=int(quantity),
            side=side
        )

        # Get updated balance
        balance = TradeService.get_balance(g.user.id)

        return jsonify({
            'message': 'Trade executed successfully',
            'trade': trade_record.to_dict(),
            'balance': float(balance),
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@buyer_bp.route('/trades', methods=['GET'])
@login_required
@role_required('buyer')
def get_trades():
    """
    Get trade history for the authenticated buyer.

    Query params:
        - sellerId: number (optional, filter by seller)
        - limit: number (optional, default 100)

    Returns:
        - 200: List of trades
        - 401: Not authenticated
        - 403: Not a buyer
    """
    seller_id = request.args.get('sellerId', type=int)
    limit = request.args.get('limit', 100, type=int)

    trades = TradeService.get_trades(
        user_id=g.user.id,
        seller_id=seller_id,
        limit=min(limit, 500)  # Cap at 500
    )

    return jsonify({'trades': trades}), 200


@buyer_bp.route('/balance', methods=['GET'])
@login_required
@role_required('buyer')
def get_balance():
    """
    Get the authenticated buyer's balance.

    Returns:
        - 200: Balance data
        - 401: Not authenticated
        - 403: Not a buyer
    """
    balance = TradeService.get_balance(g.user.id)
    return jsonify({'balance': float(balance)}), 200


@buyer_bp.route('/pnl/<int:seller_id>', methods=['GET'])
@login_required
@role_required('buyer')
def get_pnl(seller_id):
    """
    Get P&L for the authenticated buyer's position with a seller.

    Path params:
        - seller_id: The seller's user ID

    Returns:
        - 200: P&L data
        - 401: Not authenticated
        - 403: Not a buyer
    """
    pnl = TradeService.calculate_pnl(g.user.id, seller_id)
    return jsonify(pnl), 200


@buyer_bp.route('/total-pnl', methods=['GET'])
@login_required
@role_required('buyer')
def get_total_pnl():
    """
    Get total P&L for the authenticated buyer across all sellers.

    Returns realized P&L (from closed positions), unrealized P&L
    (from current positions), total P&L, and return percentage.

    Returns:
        - 200: Total P&L data
        - 401: Not authenticated
        - 403: Not a buyer
    """
    pnl = TradeService.calculate_total_pnl(g.user.id)
    return jsonify(pnl), 200


@buyer_bp.route('/balance-history', methods=['GET'])
@login_required
@role_required('buyer')
def get_balance_history():
    """
    Get balance history for the authenticated buyer.

    Query params:
        - period: string (optional, default '1M')
          Options: '1W', '2W', '1M', '3M', '6M', '1Y', 'ALL'

    Returns:
        - 200: BalanceHistoryData with userId, period, and data array
        - 401: Not authenticated
        - 403: Not a buyer
    """
    period = request.args.get('period', '1M')
    history = TradeService.get_balance_history(g.user.id, period)
    return jsonify({
        'userId': g.user.id,
        'period': period,
        'data': history
    }), 200


@buyer_bp.route('/daily-pnl', methods=['GET'])
@login_required
@role_required('buyer')
def get_daily_pnl():
    """
    Get today's P&L for the authenticated buyer.

    Returns:
        - 200: Today's P&L data
        - 401: Not authenticated
        - 403: Not a buyer
    """
    pnl = TradeService.calculate_daily_pnl(g.user.id)
    return jsonify(pnl), 200


@buyer_bp.route('/account-value-history', methods=['GET'])
@login_required
@role_required('buyer')
def get_account_value_history():
    """
    Get account value history for the authenticated buyer.

    Returns all data points (cash + equity value) over time.

    Returns:
        - 200: Account value history data
        - 401: Not authenticated
        - 403: Not a buyer
    """
    history = TradeService.get_account_value_history(g.user.id)
    return jsonify({
        'userId': g.user.id,
        'data': history
    }), 200


@buyer_bp.route('/holdings', methods=['GET'])
@login_required
@role_required('buyer')
def get_holdings():
    """
    Get all current holdings for the authenticated buyer.

    Returns positions with shares > 0, including:
    - sellerId, sellerName (symbol)
    - shares, currentPrice, costBasis
    - totalCost, currentValue, pnl, pnlPercent

    Returns:
        - 200: List of holdings
        - 401: Not authenticated
        - 403: Not a buyer
    """
    holdings = TradeService.get_holdings(g.user.id)
    return jsonify({'holdings': holdings}), 200
