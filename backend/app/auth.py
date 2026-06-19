from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import JWT_SECRET

security = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    id: str
    roleId: str | None = None
    committeeId: str | None = None
    tier: str = "NONE"


def create_access_token(user: AuthUser) -> str:
    payload = {
        "id": user.id,
        "roleId": user.roleId,
        "committeeId": user.committeeId,
        "tier": user.tier,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    payload = {
        "id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> AuthUser:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return AuthUser(
            id=data["id"],
            roleId=data.get("roleId"),
            committeeId=data.get("committeeId"),
            tier=data.get("tier", "NONE"),
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Token expired or invalid"}},
        ) from exc


async def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> AuthUser:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Missing or invalid token"}},
        )
    return decode_token(credentials.credentials)


def require_role(*allowed_tiers: str):
    async def checker(user: Annotated[AuthUser, Depends(require_auth)]) -> AuthUser:
        if not user.tier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "PERMISSION_DENIED", "message": "No role assigned"}},
            )
        if user.tier == "MASTER":
            return user
        if user.tier not in allowed_tiers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "PERMISSION_DENIED",
                        "message": "Insufficient tier permissions.",
                    }
                },
            )
        return user

    return checker
