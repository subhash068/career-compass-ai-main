from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt

def role_required(required_role: str):
    """
    Decorator to check if the current user has the required role.

    Args:
        required_role (str): The role required to access the endpoint (e.g., 'ADMIN')

    Returns:
        function: The decorated function
    """
    def wrapper(fn):
        @jwt_required()
        @wraps(fn)
        def decorator(*args, **kwargs):
            jwt_data = get_jwt()
            user_role = jwt_data.get('role', 'user')

            if user_role != required_role:
                return jsonify({'error': 'Forbidden'}), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
