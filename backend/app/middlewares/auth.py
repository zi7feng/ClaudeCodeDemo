from functools import wraps
from flask import session, jsonify, g

from ..models import User


def login_required(f):
    """
    Decorator to require user authentication.

    Checks if user is logged in via session and loads user into g.user.
    Returns 401 if not authenticated.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        user = User.query.get(user_id)
        if not user:
            session.clear()
            return jsonify({'error': 'User not found'}), 401

        g.user = user
        return f(*args, **kwargs)

    return decorated_function


def role_required(*roles):
    """
    Decorator to require specific user roles.

    Must be used after @login_required.

    Args:
        *roles: Allowed roles (e.g., 'buyer', 'seller')

    Returns 403 if user role is not in allowed roles.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'user') or g.user is None:
                return jsonify({'error': 'Authentication required'}), 401

            if g.user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403

            return f(*args, **kwargs)

        return decorated_function
    return decorator
