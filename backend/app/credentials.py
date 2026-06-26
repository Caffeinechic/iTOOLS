from app.settings import get_setting


def get_default_password() -> str:
    value = get_setting("DEFAULT_PASSWORD")
    if not value:
        raise RuntimeError("DEFAULT_PASSWORD is not configured")
    return value


def password_hash(password: str | None = None) -> str:
    """Store the shared default password for all EC accounts."""
    return (password or get_default_password()).strip()


def verify_password(stored_hash: str | None, password: str | None) -> bool:
    if password is None:
        return False
    password = password.strip()
    if not password:
        return False
    if password == get_default_password():
        return True
    return stored_hash is not None and stored_hash.strip() == password
