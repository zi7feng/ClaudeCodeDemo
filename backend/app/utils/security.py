import bcrypt


def hash_password(username: str, password: str) -> str:
    """
    Hash password using bcrypt with username as additional input.

    Combines username and password before hashing with bcrypt.

    Args:
        username: The user's username
        password: The plain text password

    Returns:
        The hashed password as a string
    """
    combined = f"{username}{password}"
    return bcrypt.hashpw(combined.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(username: str, password: str, stored_hash: str) -> bool:
    """
    Verify a password against its bcrypt hash.

    Args:
        username: The user's username
        password: The plain text password to verify
        stored_hash: The stored bcrypt password hash

    Returns:
        True if the password matches, False otherwise
    """
    combined = f"{username}{password}"
    return bcrypt.checkpw(combined.encode('utf-8'), stored_hash.encode('utf-8'))
