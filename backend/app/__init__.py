import logging
import os
from datetime import datetime
from flask import Flask
from flask_cors import CORS
from flask_session import Session
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import text

from .config import config
from .models import db

logger = logging.getLogger(__name__)

# Initialize extensions
csrf = CSRFProtect()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)


def create_app(config_name=None):
    """
    Flask application factory.

    Args:
        config_name: Configuration name ('development', 'production', 'testing')

    Returns:
        Flask application instance
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)

    # Configure session to use SQLAlchemy
    app.config['SESSION_SQLALCHEMY'] = db
    Session(app)

    # Initialize CSRF protection
    csrf.init_app(app)

    # Initialize rate limiter
    limiter.init_app(app)

    # Configure CORS
    CORS(
        app,
        origins=app.config['CORS_ORIGINS'],
        supports_credentials=app.config['CORS_SUPPORTS_CREDENTIALS'],
    )

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.seller import seller_bp
    from .routes.prices import prices_bp
    from .routes.buyer import buyer_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(seller_bp, url_prefix='/seller')
    app.register_blueprint(prices_bp, url_prefix='/prices')
    app.register_blueprint(buyer_bp, url_prefix='/buyer')

    # Create database tables and clean up invalid sessions
    with app.app_context():
        db.create_all()

        # Clean up invalid session records (Flask-Session 0.5.0 bug workaround)
        # Sessions with NULL expiry cause TypeError when compared with datetime
        try:
            result = db.session.execute(text("DELETE FROM sessions WHERE expiry IS NULL"))
            deleted_count = result.rowcount
            db.session.commit()
            if deleted_count > 0:
                logger.warning(f"Flask-Session 0.5.0 workaround: Deleted {deleted_count} sessions with NULL expiry")
        except Exception as e:
            logger.error(f"Error during session cleanup: {e}")
            db.session.rollback()

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}, 200

    # Set CSRF token cookie after each request
    @app.after_request
    def set_csrf_cookie(response):
        response.set_cookie('csrf_token', generate_csrf())
        return response

    return app
