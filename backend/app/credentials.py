import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_PASSWORD = os.getenv("DEFAULT_PASSWORD", "admin123")


def password_hash(password: str | None = None) -> str:
    """Store the shared default password for all EC accounts."""
    return (password or DEFAULT_PASSWORD).strip()


def verify_password(stored_hash: str | None, password: str | None) -> bool:
    if password is None:
        return False
    password = password.strip()
    if not password:
        return False
    if password == DEFAULT_PASSWORD:
        return True
    return stored_hash is not None and stored_hash.strip() == password
