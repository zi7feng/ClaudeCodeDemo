from datetime import datetime
from flask import Blueprint, request, jsonify, g

from ..middlewares.auth import login_required, role_required
from ..services.price_service import PriceService
from ..services.trade_service import TradeService
from ..models import db, User

seller_bp = Blueprint('seller', __name__)


@seller_bp.route('/upload-price', methods=['POST'])
@login_required
@role_required('seller')
def upload_price():
    """
    Upload a price for the authenticated seller.

    Request body:
        - date: string (YYYY-MM-DD, required)
        - session: 'AM' | 'PM' (required)
        - price: number (required)

    Returns:
        - 200: Price uploaded successfully
        - 400: Invalid input
        - 401: Not authenticated
        - 403: Not a seller
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    # Validate required fields
    date_str = data.get('date')
    session_type = data.get('session')
    price = data.get('price')

    if not date_str:
        return jsonify({'error': 'Date is required'}), 400
    if not session_type:
        return jsonify({'error': 'Session is required'}), 400
    if price is None:
        return jsonify({'error': 'Price is required'}), 400

    # Parse date
    try:
        price_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Upload price
    try:
        price_record = PriceService.upload_price(
            seller_id=g.user.id,
            price_date=price_date,
            session_type=session_type,
            price=float(price)
        )
        return jsonify({
            'message': 'Price uploaded successfully',
            'price': price_record.to_dict(),
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@seller_bp.route('/settings', methods=['GET'])
@login_required
@role_required('seller')
def get_settings():
    """
    Get seller's price calculation settings.

    Returns:
        - 200: Settings data
        - 401: Not authenticated
        - 403: Not a seller
    """
    return jsonify({
        'baselineWeight': float(g.user.baselineWeight) if g.user.baselineWeight else None,
        'basePrice': float(g.user.basePrice) if g.user.basePrice else None,
        'kUp': float(g.user.kUp) if g.user.kUp else None,
        'kDown': float(g.user.kDown) if g.user.kDown else None,
    }), 200


@seller_bp.route('/settings', methods=['PUT'])
@login_required
@role_required('seller')
def update_settings():
    """
    Update seller's price calculation settings.

    Request body:
        - baselineWeight: number (optional)
        - basePrice: number (optional)
        - kUp: number (optional)
        - kDown: number (optional)

    Returns:
        - 200: Settings updated
        - 400: Invalid input
        - 401: Not authenticated
        - 403: Not a seller
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    # Update fields if provided
    if 'baselineWeight' in data:
        g.user.baselineWeight = data['baselineWeight']
    if 'basePrice' in data:
        g.user.basePrice = data['basePrice']
    if 'kUp' in data:
        g.user.kUp = data['kUp']
    if 'kDown' in data:
        g.user.kDown = data['kDown']

    db.session.commit()

    return jsonify({
        'message': 'Settings updated successfully',
        'settings': {
            'baselineWeight': float(g.user.baselineWeight) if g.user.baselineWeight else None,
            'basePrice': float(g.user.basePrice) if g.user.basePrice else None,
            'kUp': float(g.user.kUp) if g.user.kUp else None,
            'kDown': float(g.user.kDown) if g.user.kDown else None,
        },
    }), 200


@seller_bp.route('/prices', methods=['GET'])
@login_required
@role_required('seller')
def get_my_prices():
    """
    Get authenticated seller's price history.

    Returns:
        - 200: List of prices
        - 401: Not authenticated
        - 403: Not a seller
    """
    prices = PriceService.get_prices_by_seller(g.user.id)
    return jsonify({
        'prices': [p.to_dict() for p in prices],
    }), 200


@seller_bp.route('/balance', methods=['GET'])
@login_required
@role_required('seller')
def get_balance():
    """
    Get the authenticated seller's balance.

    Returns:
        - 200: Balance data
        - 401: Not authenticated
        - 403: Not a seller
    """
    balance = TradeService.get_balance(g.user.id)
    return jsonify({'balance': float(balance)}), 200


@seller_bp.route('/earnings', methods=['GET'])
@login_required
@role_required('seller')
def get_earnings():
    """
    Get the authenticated seller's earnings statistics.

    Returns total received from buyer purchases, total paid out
    for buyer sells, net earnings, and transaction counts.

    Returns:
        - 200: Earnings data
        - 401: Not authenticated
        - 403: Not a seller
    """
    earnings = TradeService.calculate_seller_earnings(g.user.id)
    return jsonify(earnings), 200


@seller_bp.route('/trade-history', methods=['GET'])
@login_required
@role_required('seller')
def get_trade_history():
    """
    Get the authenticated seller's trade history.

    Query parameters:
        - limit: int (optional, default 100) - Maximum number of trades to return

    Returns:
        - 200: List of trades with buyer info
        - 401: Not authenticated
        - 403: Not a seller
    """
    limit = request.args.get('limit', 100, type=int)
    trades = TradeService.get_seller_trades(g.user.id, limit=limit)
    return jsonify({'trades': trades}), 200


@seller_bp.route('/filled-sessions', methods=['GET'])
@login_required
@role_required('seller')
def get_filled_sessions():
    """
    Get the sessions that have already been filled for a specific date.

    Query parameters:
        - date: string (YYYY-MM-DD, required)

    Returns:
        - 200: List of filled sessions (AM/PM)
        - 400: Invalid date format
        - 401: Not authenticated
        - 403: Not a seller
    """
    date_str = request.args.get('date')

    if not date_str:
        return jsonify({'error': 'Date is required'}), 400

    try:
        query_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    filled_sessions = PriceService.get_filled_sessions(g.user.id, query_date)
    return jsonify({'filledSessions': filled_sessions}), 200


@seller_bp.route('/balance-history', methods=['GET'])
@login_required
@role_required('seller')
def get_balance_history():
    """
    Get balance history for the authenticated seller.

    Query parameters:
        - period: string (optional, default '1M')
          Options: '1W', '2W', '1M', '3M', '6M', '1Y', 'ALL'

    Returns:
        - 200: BalanceHistoryData with userId, period, and data array
        - 401: Not authenticated
        - 403: Not a seller
    """
    period = request.args.get('period', '1M')
    history = TradeService.get_balance_history(g.user.id, period)
    return jsonify({
        'userId': g.user.id,
        'period': period,
        'data': history
    }), 200


@seller_bp.route('/daily-earnings', methods=['GET'])
@login_required
@role_required('seller')
def get_daily_earnings():
    """
    Get today's earnings for the authenticated seller.

    Returns:
        - 200: Today's earnings data
        - 401: Not authenticated
        - 403: Not a seller
    """
    earnings = TradeService.calculate_daily_earnings(g.user.id)
    return jsonify(earnings), 200
