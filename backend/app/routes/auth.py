import asyncio
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth import AuthUser, create_access_token, create_refresh_token, require_auth
from app.config import NODE_ENV
from app.credentials import password_hash, verify_password
from app.committees import MAIN_SB_COMMITTEE_NAME, LEGACY_MAIN_SB_COMMITTEE_NAME
from app.database import get_db, new_id, serialize_user
from app.settings import get_setting

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


def _verify_google_id_token(id_token: str) -> dict:
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(id_token)}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        raise HTTPException(status_code=401, detail={"error": "Invalid Google token"}) from exc

    client_id = get_setting("GOOGLE_CLIENT_ID")
    if client_id and data.get("aud") != client_id:
        raise HTTPException(status_code=401, detail={"error": "Google client mismatch"})
    if data.get("email_verified") not in ("true", True):
        raise HTTPException(status_code=401, detail={"error": "Google email not verified"})
    if not data.get("email"):
        raise HTTPException(status_code=401, detail={"error": "Google account has no email"})
    return data


async def _default_committee_and_role():
    committee = await get_db().committees.find_one(
        {"name": {"$in": [MAIN_SB_COMMITTEE_NAME, LEGACY_MAIN_SB_COMMITTEE_NAME]}}
    )
    if not committee:
        committee = await get_db().committees.find_one({})
    if not committee:
        raise HTTPException(status_code=503, detail={"error": "No committee configured. Run seed first."})

    default_role = await get_db().roles.find_one(
        {"committeeId": committee["_id"], "tier": "OPERATIONS"},
        sort=[("name", 1)],
    )
    if not default_role:
        default_role = await get_db().roles.find_one({"committeeId": committee["_id"]})
    if not default_role:
        raise HTTPException(status_code=503, detail={"error": "No roles configured. Run seed first."})
    return committee, default_role


def _session_response(user: dict, populated: dict, response: Response) -> dict:
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


@router.post("/google")
async def google_login(body: dict, response: Response):
    credential = (body.get("credential") or "").strip()
    if not credential:
        raise HTTPException(status_code=400, detail={"error": "Missing Google credential"})

    google_user = await asyncio.to_thread(_verify_google_id_token, credential)
    email = str(google_user["email"]).strip().lower()
    name = (google_user.get("name") or email.split("@")[0]).strip()
    google_id = google_user.get("sub")

    user = await find_user_by_email(email)
    if not user:
        committee, default_role = await _default_committee_and_role()
        now = datetime.now(timezone.utc)
        user = {
            "_id": new_id(),
            "committeeId": committee["_id"],
            "roleId": default_role["_id"],
            "name": name,
            "email": email,
            "passwordHash": password_hash(),
            "googleId": google_id,
            "isActive": True,
            "createdAt": now,
        }
        await get_db().users.insert_one(user)
    elif google_id and not user.get("googleId"):
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {"$set": {"googleId": google_id}},
        )
        user["googleId"] = google_id

    populated = await serialize_user(user)
    return _session_response(user, populated, response)


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
    return _session_response(user, populated, response)


@router.post("/register")
async def register(body: dict, response: Response):
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password")
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail={"error": "Name, email, and password are required"})
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail={"error": "Password must be at least 8 characters"},
        )
    if await find_user_by_email(email):
        raise HTTPException(status_code=409, detail={"error": "Email already registered"})

    committee, default_role = await _default_committee_and_role()

    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id(),
        "committeeId": committee["_id"],
        "roleId": default_role["_id"],
        "name": name,
        "email": email,
        "passwordHash": password_hash(password),
        "isActive": True,
        "createdAt": now,
    }
    await get_db().users.insert_one(doc)
    populated = await serialize_user(doc)
    return _session_response(doc, populated, response)


@router.get("/me")
async def me(user: Annotated[AuthUser, Depends(require_auth)]):
    doc = await get_db().users.find_one({"_id": user.id})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    return {"user": await serialize_user(doc)}
