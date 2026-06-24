from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from app.auth import AuthUser, require_auth, require_role
from app.database import get_db, new_id, serialize_communication

router = APIRouter(prefix="/communications", tags=["communications"])

VALID_TYPES = ("ANNOUNCEMENT", "MEETING_MINUTES", "DISCUSSION")
VALID_PRIORITIES = ("NORMAL", "HIGH", "URGENT")


def _committee_filter(user: AuthUser) -> dict:
    if user.tier == "MASTER":
        return {}
    if user.committeeId:
        return {"committeeId": user.committeeId}
    return {}


@router.get("")
async def list_communications(
    user: Annotated[AuthUser, Depends(require_auth)],
    type: str | None = None,
    parentId: str | None = None,
):
    query: dict = {**_committee_filter(user)}
    if parentId:
        query["parentId"] = parentId
    else:
        query["$or"] = [{"parentId": None}, {"parentId": {"$exists": False}}]
    if type:
        if type not in VALID_TYPES:
            raise HTTPException(status_code=400, detail={"error": f"Invalid type. Use: {', '.join(VALID_TYPES)}"})
        query["type"] = type
    rows = (
        await get_db()
        .communications.find(query)
        .sort([("pinned", -1), ("createdAt", -1)])
        .limit(100)
        .to_list(length=100)
    )
    enriched = []
    for row in rows:
        item = await serialize_communication(row)
        if row.get("type") == "DISCUSSION" and not row.get("parentId"):
            item["replyCount"] = await get_db().communications.count_documents(
                {"parentId": row["_id"]}
            )
        enriched.append(item)
    return {"data": enriched}


@router.get("/{comm_id}")
async def get_communication(comm_id: str, user: Annotated[AuthUser, Depends(require_auth)]):
    doc = await get_db().communications.find_one({"_id": comm_id})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Not found"})
    if user.tier != "MASTER" and doc.get("committeeId") != user.committeeId:
        raise HTTPException(status_code=403, detail={"error": "Permission denied"})
    item = await serialize_communication(doc)
    if doc.get("type") == "DISCUSSION" and not doc.get("parentId"):
        replies = (
            await get_db()
            .communications.find({"parentId": comm_id})
            .sort("createdAt", 1)
            .to_list(length=200)
        )
        item["replies"] = [await serialize_communication(r) for r in replies]
    return {"data": item}


@router.post("")
async def create_communication(
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    comm_type = body.get("type", "ANNOUNCEMENT")
    if comm_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail={"error": "Invalid communication type"})
    if comm_type == "ANNOUNCEMENT" and user.tier not in ("MASTER", "LEADERSHIP"):
        raise HTTPException(status_code=403, detail={"error": "Only leadership can post announcements"})
    title = (body.get("title") or "").strip()
    content = (body.get("content") or "").strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail={"error": "Title and content are required"})
    priority = body.get("priority", "NORMAL")
    if priority not in VALID_PRIORITIES:
        priority = "NORMAL"
    now = datetime.now(timezone.utc)
    meeting_date = None
    if body.get("meetingDate"):
        meeting_date = datetime.fromisoformat(body["meetingDate"].replace("Z", "+00:00"))
    doc = {
        "_id": new_id(),
        "type": comm_type,
        "committeeId": body.get("committeeId") or user.committeeId,
        "authorId": user.id,
        "title": title,
        "content": content,
        "priority": priority,
        "pinned": bool(body.get("pinned", False)),
        "parentId": body.get("parentId"),
        "meetingDate": meeting_date,
        "createdAt": now,
        "updatedAt": now,
    }
    await get_db().communications.insert_one(doc)
    return {"data": await serialize_communication(doc)}


@router.post("/{comm_id}/replies")
async def add_reply(
    comm_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    parent = await get_db().communications.find_one({"_id": comm_id})
    if not parent or parent.get("type") != "DISCUSSION" or parent.get("parentId"):
        raise HTTPException(status_code=404, detail={"error": "Discussion thread not found"})
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail={"error": "Content is required"})
    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id(),
        "type": "DISCUSSION",
        "committeeId": parent.get("committeeId"),
        "authorId": user.id,
        "title": f"Re: {parent.get('title', 'Discussion')}",
        "content": content,
        "priority": "NORMAL",
        "pinned": False,
        "parentId": comm_id,
        "meetingDate": None,
        "createdAt": now,
        "updatedAt": now,
    }
    await get_db().communications.insert_one(doc)
    return {"data": await serialize_communication(doc)}


@router.patch("/{comm_id}")
async def update_communication(
    comm_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    existing = await get_db().communications.find_one({"_id": comm_id})
    if not existing:
        raise HTTPException(status_code=404, detail={"error": "Not found"})
    if existing.get("authorId") != user.id and user.tier not in ("MASTER", "LEADERSHIP"):
        raise HTTPException(status_code=403, detail={"error": "Permission denied"})
    update: dict = {"updatedAt": datetime.now(timezone.utc)}
    for key in ("title", "content", "pinned"):
        if key in body:
            update[key] = body[key]
    if "priority" in body and body["priority"] in VALID_PRIORITIES:
        update["priority"] = body["priority"]
    updated = await get_db().communications.find_one_and_update(
        {"_id": comm_id},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    return {"data": await serialize_communication(updated) if updated else None}


@router.delete("/{comm_id}")
async def delete_communication(
    comm_id: str,
    user: Annotated[AuthUser, Depends(require_role("MASTER", "LEADERSHIP"))],
):
    await get_db().communications.delete_many({"parentId": comm_id})
    result = await get_db().communications.delete_one({"_id": comm_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail={"error": "Not found"})
    return {"message": "Deleted"}
