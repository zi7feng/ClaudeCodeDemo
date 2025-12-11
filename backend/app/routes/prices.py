from flask import Blueprint, request, jsonify

from ..services.chart_service import ChartService
from ..models import User

prices_bp = Blueprint('prices', __name__)


@prices_bp.route('/<int:seller_id>', methods=['GET'])
def get_seller_prices(seller_id):
    """
    Get price chart data for a seller.

    Path params:
        - seller_id: The seller's user ID

    Query params:
        - period: '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'All' (default: '1M')

    Returns:
        - 200: Chart data with prices and moving averages
        - 404: Seller not found
    """
    # Validate seller exists
    seller = User.query.get(seller_id)
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404
    if seller.role != 'seller':
        return jsonify({'error': 'User is not a seller'}), 404

    # Get period from query params
    period = request.args.get('period', '1M')

    # Get chart data
    chart_data = ChartService.get_price_chart_data(seller_id, period)

    return jsonify({
        'sellerId': seller_id,
        'sellerName': seller.username,
        'period': period,
        'data': chart_data,
    }), 200


@prices_bp.route('/<int:seller_id>/stats', methods=['GET'])
def get_seller_price_stats(seller_id):
    """
    Get price statistics for a seller.

    Path params:
        - seller_id: The seller's user ID

    Returns:
        - 200: Price statistics (lastSalePrice, 1w/1m/3m/6m high/low)
        - 404: Seller not found
    """
    # Validate seller exists
    seller = User.query.get(seller_id)
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404
    if seller.role != 'seller':
        return jsonify({'error': 'User is not a seller'}), 404

    # Get price statistics
    stats = ChartService.get_price_stats(seller_id)

    return jsonify({
        'sellerId': seller_id,
        'sellerName': seller.username,
        'stats': stats,
    }), 200


@prices_bp.route('/sellers', methods=['GET'])
def get_all_sellers():
    """
    Get all sellers with their latest prices.

    Query params:
        - search: Optional search string for fuzzy matching on seller username

    Returns:
        - 200: List of sellers with latest prices
    """
    search = request.args.get('search')
    sellers = ChartService.get_all_sellers_with_latest_price(search=search)
    return jsonify({'sellers': sellers}), 200
