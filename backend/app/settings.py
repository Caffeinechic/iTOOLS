"""Runtime system settings — encrypted in MongoDB, injected at startup.

Only bootstrap secrets stay in the host environment (never committed):
  MONGO_URI, SETTINGS_ENCRYPTION_KEY, PORT, NODE_ENV
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

BOOTSTRAP_KEYS = frozenset({"MONGO_URI", "SETTINGS_ENCRYPTION_KEY", "PORT", "NODE_ENV"})

SETTING_DEFINITIONS: dict[str, dict[str, Any]] = {
    "JWT_SECRET": {
        "category": "auth",
        "label": "JWT Secret",
        "description": "Signing key for access and refresh tokens.",
        "isSecret": True,
    },
    "DEFAULT_PASSWORD": {
        "category": "auth",
        "label": "Default EC Password",
        "description": "Shared login password synced to all EC accounts on startup.",
        "isSecret": True,
    },
    "SMTP_HOST": {
        "category": "email",
        "label": "SMTP Host",
        "description": "Outbound mail server hostname.",
        "isSecret": False,
    },
    "SMTP_PORT": {
        "category": "email",
        "label": "SMTP Port",
        "description": "Outbound mail server port.",
        "isSecret": False,
    },
    "SMTP_USER": {
        "category": "email",
        "label": "SMTP Username",
        "description": "SMTP authentication username.",
        "isSecret": False,
    },
    "SMTP_PASSWORD": {
        "category": "email",
        "label": "SMTP Password",
        "description": "SMTP authentication password.",
        "isSecret": True,
    },
    "API_BASE_URL": {
        "category": "integration",
        "label": "External API Base URL",
        "description": "Base URL for third-party integrations.",
        "isSecret": False,
    },
    "WEBHOOK_SECRET": {
        "category": "integration",
        "label": "Webhook Secret",
        "description": "Shared secret for verifying inbound webhooks.",
        "isSecret": True,
    },
}

_cache: dict[str, str] = {}


def _fernet() -> Fernet:
    raw = os.getenv("SETTINGS_ENCRYPTION_KEY", "").strip()
    if not raw:
        raise RuntimeError(
            "SETTINGS_ENCRYPTION_KEY is not set. "
            "Generate one: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    return Fernet(raw.encode() if isinstance(raw, str) else raw)


def encrypt_value(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt_value(value_enc: str) -> str:
    try:
        return _fernet().decrypt(value_enc.encode()).decode()
    except InvalidToken as exc:
        raise RuntimeError("Failed to decrypt setting — check SETTINGS_ENCRYPTION_KEY") from exc


def get_setting(key: str, fallback: str | None = None) -> str:
    if key in BOOTSTRAP_KEYS:
        return os.getenv(key, fallback or "")
    if key in _cache:
        return _cache[key]
    env_val = os.getenv(key)
    if env_val is not None:
        return env_val
    return fallback or ""


def invalidate_cache() -> None:
    _cache.clear()


async def load_settings_cache(db=None) -> None:
    if db is None:
        from app.database import get_db

        db = get_db()
    _cache.clear()
    async for doc in db.system_settings.find():
        key = doc.get("key")
        value_enc = doc.get("valueEnc")
        if key and value_enc:
            _cache[key] = decrypt_value(value_enc)


async def bootstrap_runtime_settings(db=None) -> None:
    """Ensure required runtime settings exist in DB (auto-generated on first run)."""
    if db is None:
        from app.database import get_db

        db = get_db()
    now = datetime.now(timezone.utc)

    defaults: dict[str, str] = {
        "JWT_SECRET": secrets.token_urlsafe(48),
        "DEFAULT_PASSWORD": secrets.token_urlsafe(16),
    }

    for key, default_value in defaults.items():
        existing = await db.system_settings.find_one({"key": key})
        if existing:
            continue
        meta = SETTING_DEFINITIONS.get(key, {})
        await db.system_settings.insert_one(
            {
                "_id": key.lower(),
                "key": key,
                "valueEnc": encrypt_value(default_value),
                "category": meta.get("category", "general"),
                "label": meta.get("label", key.replace("_", " ").title()),
                "description": meta.get("description", ""),
                "isSecret": meta.get("isSecret", True),
                "updatedAt": now,
                "updatedBy": "system",
            }
        )
        print(f"  Bootstrapped system setting: {key}")


def mask_value(value: str, is_secret: bool) -> str:
    if not is_secret:
        return value
    if len(value) <= 4:
        return "••••"
    return value[:2] + "•" * min(len(value) - 4, 12) + value[-2:]


def serialize_setting(doc: dict[str, Any], *, reveal: bool = False) -> dict[str, Any]:
    key = doc.get("key", "")
    is_secret = doc.get("isSecret", True)
    plain = decrypt_value(doc["valueEnc"])
    display = plain if reveal else mask_value(plain, is_secret)
    return {
        "id": doc["_id"],
        "key": key,
        "value": display,
        "category": doc.get("category", "general"),
        "label": doc.get("label", key),
        "description": doc.get("description", ""),
        "isSecret": is_secret,
        "updatedAt": doc.get("updatedAt", "").isoformat()
        if hasattr(doc.get("updatedAt"), "isoformat")
        else doc.get("updatedAt"),
        "updatedBy": doc.get("updatedBy"),
        "isBootstrap": key in BOOTSTRAP_KEYS,
    }


async def upsert_setting(
    key: str,
    value: str,
    *,
    updated_by: str,
    category: str | None = None,
    label: str | None = None,
    description: str | None = None,
    is_secret: bool | None = None,
    db=None,
) -> dict[str, Any]:
    if key in BOOTSTRAP_KEYS:
        raise ValueError(f"{key} is a bootstrap-only variable and cannot be stored in system settings")

    if db is None:
        from app.database import get_db

        db = get_db()

    meta = SETTING_DEFINITIONS.get(key, {})
    now = datetime.now(timezone.utc)
    doc = {
        "_id": key.lower(),
        "key": key.upper(),
        "valueEnc": encrypt_value(value),
        "category": category or meta.get("category", "general"),
        "label": label or meta.get("label", key.replace("_", " ").title()),
        "description": description if description is not None else meta.get("description", ""),
        "isSecret": is_secret if is_secret is not None else meta.get("isSecret", True),
        "updatedAt": now,
        "updatedBy": updated_by,
    }
    await db.system_settings.replace_one({"key": doc["key"]}, doc, upsert=True)
    _cache[doc["key"]] = value
    return doc


async def delete_setting(key: str, db=None) -> bool:
    if key in BOOTSTRAP_KEYS:
        raise ValueError(f"{key} cannot be deleted")

    if db is None:
        from app.database import get_db

        db = get_db()

    result = await db.system_settings.delete_one({"key": key.upper()})
    _cache.pop(key.upper(), None)
    return result.deleted_count > 0
