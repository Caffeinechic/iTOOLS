import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth import AuthUser, create_access_token, create_refresh_token, require_auth
from app.config import NODE_ENV
from app.credentials import verify_password
from app.database import get_db, serialize_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Legacy docs used this email before chair@ieeesb.org was standardized.
EMAIL_ALIASES = {
    "aditya@ieeesb.org": "chair@ieeesb.org",
}


async def find_user_by_email(email: str):
    normalized = email.strip().lower()
    normalized = EMAIL_ALIASES.get(normalized, normalized)
    user = await get_db().users.find_one({"email": normalized})
    if user:
        return user
    return await get_db().users.find_one(
        {"email": {"$regex": f"^{re.escape(email.strip())}$", "$options": "i"}}
    )


@router.post("/login")
async def login(body: dict, response: Response):
    email = (body.get("email") or "").strip()
    password = body.get("password")
    if not email:
        raise HTTPException(status_code=401, detail={"error": "Invalid credentials"})

    user = await find_user_by_email(email)
    if not user or not verify_password(user.get("passwordHash"), password):
        raise HTTPException(status_code=401, detail={"error": "Invalid credentials"})
    populated = await serialize_user(user)
    role = populated.get("role") if populated else None
    tier = role.get("tier", "NONE") if role else "NONE"

    token = create_access_token(
        AuthUser(
            id=user["_id"],
            roleId=user.get("roleId"),
            committeeId=user.get("committeeId"),
            tier=tier,
        )
    )
    refresh = create_refresh_token(user["_id"])
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=NODE_ENV == "production",
        max_age=7 * 24 * 60 * 60,
    )
    return {"token": token, "user": populated}


@router.get("/me")
async def me(user: Annotated[AuthUser, Depends(require_auth)]):
    doc = await get_db().users.find_one({"_id": user.id})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    return {"user": await serialize_user(doc)}
