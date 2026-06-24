from typing import Annotated

from fastapi import APIRouter, Depends
from pymongo import ReturnDocument

from app.auth import AuthUser, require_auth
from app.database import get_db, serialize_notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(user: Annotated[AuthUser, Depends(require_auth)]):
    rows = (
        await get_db()
        .notifications.find({"recipientId": user.id})
        .sort("sentAt", -1)
        .limit(50)
        .to_list(length=50)
    )
    return {"data": [await serialize_notification(r) for r in rows]}


@router.get("/unread-count")
async def unread_count(user: Annotated[AuthUser, Depends(require_auth)]):
    count = await get_db().notifications.count_documents({"recipientId": user.id, "isRead": False})
    return {"data": {"count": count}}


@router.patch("/read-all")
async def mark_all_read(user: Annotated[AuthUser, Depends(require_auth)]):
    await get_db().notifications.update_many(
        {"recipientId": user.id, "isRead": False},
        {"$set": {"isRead": True}},
    )
    return {"message": "All notifications marked as read"}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, user: Annotated[AuthUser, Depends(require_auth)]):
    updated = await get_db().notifications.find_one_and_update(
        {"_id": notification_id, "recipientId": user.id},
        {"$set": {"isRead": True}},
        return_document=ReturnDocument.AFTER,
    )
    return {"data": await serialize_notification(updated) if updated else None}
