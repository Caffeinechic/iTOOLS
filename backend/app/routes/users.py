from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from app.auth import AuthUser, require_auth, require_role
from app.credentials import password_hash
from app.database import get_db, serialize_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(user: Annotated[AuthUser, Depends(require_role("MASTER", "LEADERSHIP"))]):
    requesting = await get_db().users.find_one({"_id": user.id})
    committee = None
    if requesting and requesting.get("committeeId"):
        committee = await get_db().committees.find_one({"_id": requesting["committeeId"]})

    is_executive_or_main = user.tier == "MASTER" or (
        committee
        and committee.get("name")
        in ("Executive Chairs", "Silver Oak University IEEE Student Branch")
    )
    query = {} if is_executive_or_main else ({"committeeId": user.committeeId} if user.committeeId else {})
    users = await get_db().users.find(query).to_list(length=500)
    return {"data": [await serialize_user(u) for u in users]}


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    if user.id != user_id and user.tier != "MASTER":
        raise HTTPException(status_code=403, detail={"error": "Permission Denied"})
    if "passwordHash" in body:
        body["passwordHash"] = password_hash()
    updated = await get_db().users.find_one_and_update(
        {"_id": user_id},
        {"$set": body},
        return_document=ReturnDocument.AFTER,
    )
    return {"data": await serialize_user(updated) if updated else None}
