from flask import Blueprint, request, jsonify, session

from ..models import db, User, Balance
from ..utils.security import hash_password, verify_password

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.

    Request body:
        - username: string (required)
        - password: string (required)
        - role: 'buyer' | 'seller' (required)
        - baselineWeight: number (optional, for sellers)
        - basePrice: number (optional, for sellers)
        - kUp: number (optional, for sellers)
        - kDown: number (optional, for sellers)

    Returns:
        - 201: User created successfully
        - 400: Invalid input
        - 409: Username already exists
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')
    role = data.get('role', '').strip()

    # Validate required fields
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    if role not in ('buyer', 'seller'):
        return jsonify({'error': 'Role must be buyer or seller'}), 400

    # Check if username exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 409

    # Create user
    password_hash = hash_password(username, password)
    user = User(
        username=username,
        passwordHash=password_hash,
        role=role,
    )

    # Set seller-specific fields
    if role == 'seller':
        user.baselineWeight = data.get('baselineWeight')
        user.basePrice = data.get('basePrice')
        user.kUp = data.get('kUp')
        user.kDown = data.get('kDown')

    db.session.add(user)
    db.session.flush()  # Get the user ID

    # Create balance record for all users (buyers and sellers)
    balance = Balance(userId=user.id, balance=0.00)
    db.session.add(balance)

    db.session.commit()

    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and create session.

    Request body:
        - username: string (required)
        - password: string (required)

    Returns:
        - 200: Login successful
        - 400: Invalid input
        - 401: Invalid credentials
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Find user
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401

    # Verify password
    if not verify_password(username, password, user.passwordHash):
        return jsonify({'error': 'Invalid username or password'}), 401

    # Create session with new session ID to prevent session fixation
    session.clear()
    session.modified = True
    session['user_id'] = user.id
    session.permanent = True

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Clear user session.

    Returns:
        - 200: Logout successful
    """
    session.clear()
    session.permanent = True
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Get current authenticated user.

    Returns:
        - 200: User data
        - 401: Not authenticated
    """
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({'error': 'User not found'}), 401

    return jsonify({'user': user.to_dict()}), 200
