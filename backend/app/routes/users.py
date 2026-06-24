from datetime import datetime, timezone

from typing import Annotated



from fastapi import APIRouter, Depends, HTTPException

from pymongo import ReturnDocument



from app.auth import AuthUser, require_auth, require_role
from app.committees import EXEC_OR_MAIN_COMMITTEE_NAMES
from app.credentials import password_hash

from app.database import get_db, new_id, serialize_user



router = APIRouter(prefix="/users", tags=["users"])





async def _can_manage_user(actor: AuthUser, target: dict) -> bool:

    if actor.id == target["_id"]:

        return True

    if actor.tier == "MASTER":

        return True

    if actor.tier == "LEADERSHIP" and target.get("committeeId") == actor.committeeId:

        return True

    return False





async def _committee_from_role(role_id: str | None) -> str | None:

    if not role_id:

        return None

    role = await get_db().roles.find_one({"_id": role_id})

    return role.get("committeeId") if role else None





@router.get("")

async def list_users(user: Annotated[AuthUser, Depends(require_auth)]):

    """List committee members. Scoped by role: exec/main see all; others see their committee."""

    requesting = await get_db().users.find_one({"_id": user.id})

    committee = None

    if requesting and requesting.get("committeeId"):

        committee = await get_db().committees.find_one({"_id": requesting["committeeId"]})



    is_executive_or_main = user.tier == "MASTER" or (
        committee
        and committee.get("name")
        in EXEC_OR_MAIN_COMMITTEE_NAMES
    )

    query: dict = {"isActive": {"$ne": False}}

    if not is_executive_or_main:

        if user.committeeId:

            query["committeeId"] = user.committeeId

        else:

            query["_id"] = user.id

    users = await get_db().users.find(query).to_list(length=500)

    return {"data": [await serialize_user(u) for u in users]}





@router.post("")

async def create_user(

    body: dict,

    user: Annotated[AuthUser, Depends(require_role("MASTER", "LEADERSHIP"))],

):

    name = (body.get("name") or "").strip()

    email = (body.get("email") or "").strip().lower()

    role_id = body.get("roleId")

    if not name or not email or not role_id:

        raise HTTPException(status_code=400, detail={"error": "name, email, and roleId are required"})



    committee_id = body.get("committeeId") or await _committee_from_role(role_id) or user.committeeId
    role_doc = await get_db().roles.find_one({"_id": role_id})
    if role_doc and role_doc.get("roleKind") == "CHAPTER" and not committee_id:
        raise HTTPException(status_code=400, detail={"error": "Select a society, group, or unit for this role"})

    if user.tier == "LEADERSHIP" and committee_id != user.committeeId:

        raise HTTPException(status_code=403, detail={"error": "You can only add members to your committee"})



    if await get_db().users.find_one({"email": email}):

        raise HTTPException(status_code=409, detail={"error": "Email already exists"})



    now = datetime.now(timezone.utc)

    doc = {

        "_id": new_id(),

        "committeeId": committee_id,

        "roleId": role_id,

        "name": name,

        "email": email,

        "passwordHash": password_hash(),

        "isActive": True,

        "createdAt": now,

    }

    await get_db().users.insert_one(doc)

    return {"data": await serialize_user(doc)}





@router.patch("/{user_id}")

async def update_user(

    user_id: str,

    body: dict,

    user: Annotated[AuthUser, Depends(require_auth)],

):

    target = await get_db().users.find_one({"_id": user_id})

    if not target:

        raise HTTPException(status_code=404, detail={"error": "User not found"})

    if not await _can_manage_user(user, target):

        raise HTTPException(status_code=403, detail={"error": "Permission denied"})



    update: dict = {}

    if "name" in body and body["name"]:

        update["name"] = str(body["name"]).strip()

    if "email" in body and body["email"]:

        update["email"] = str(body["email"]).strip().lower()

    if "committeeId" in body and body["committeeId"] and user.tier in ("MASTER", "LEADERSHIP"):

        cid = str(body["committeeId"])

        if user.tier == "LEADERSHIP" and cid != user.committeeId:

            raise HTTPException(status_code=403, detail={"error": "You can only assign members to your committee"})

        update["committeeId"] = cid



    if "roleId" in body and body["roleId"]:

        role_id = body["roleId"]

        if user.tier == "LEADERSHIP" and user.id != user_id:

            update["roleId"] = role_id

            committee_id = await _committee_from_role(role_id)

            if committee_id and committee_id != user.committeeId:

                raise HTTPException(status_code=403, detail={"error": "Role must belong to your committee"})

            if committee_id:

                update["committeeId"] = committee_id

        elif user.tier == "MASTER":

            update["roleId"] = role_id

            committee_id = body.get("committeeId") or await _committee_from_role(role_id)

            if committee_id:

                update["committeeId"] = committee_id



    if "passwordHash" in body:

        if user.tier not in ("MASTER", "LEADERSHIP") and user.id != user_id:

            raise HTTPException(status_code=403, detail={"error": "Permission denied"})

        update["passwordHash"] = password_hash()



    if not update:

        raise HTTPException(status_code=400, detail={"error": "No valid fields to update"})



    updated = await get_db().users.find_one_and_update(

        {"_id": user_id},

        {"$set": update},

        return_document=ReturnDocument.AFTER,

    )

    return {"data": await serialize_user(updated) if updated else None}





@router.delete("/{user_id}")

async def delete_user(

    user_id: str,

    user: Annotated[AuthUser, Depends(require_role("MASTER", "LEADERSHIP"))],

):

    target = await get_db().users.find_one({"_id": user_id})

    if not target:

        raise HTTPException(status_code=404, detail={"error": "User not found"})

    if not await _can_manage_user(user, target):

        raise HTTPException(status_code=403, detail={"error": "Permission denied"})

    if user_id == user.id:

        raise HTTPException(status_code=400, detail={"error": "You cannot remove your own account"})



    await get_db().users.update_one({"_id": user_id}, {"$set": {"isActive": False}})

    return {"message": "Member removed"}

