from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.auth import AuthUser, require_auth, require_role
from app.committees import (
    CATEGORY_AFFINITY_GROUP,
    CATEGORY_GROUP,
    CATEGORY_SOCIETY,
    EXEC_OR_MAIN_COMMITTEE_NAMES,
)
from app.database import get_db, new_id, serialize_doc

router = APIRouter(prefix="/committees", tags=["committees"])

CREATABLE_CATEGORIES = (CATEGORY_SOCIETY, CATEGORY_AFFINITY_GROUP, CATEGORY_GROUP)

CATEGORY_NAME_SUFFIX = {
    CATEGORY_SOCIETY: "Society Chapter",
    CATEGORY_AFFINITY_GROUP: "Affinity Group",
    CATEGORY_GROUP: "Group",
}


def _build_committee_name(short_name: str, category: str) -> str:
    suffix = CATEGORY_NAME_SUFFIX.get(category, "Group")
    return f"SOU IEEE {short_name} {suffix}"


async def _scope_filter(user: AuthUser) -> dict[str, Any]:
    if user.tier == "MASTER":
        return {}
    if user.committeeId:
        committee = await get_db().committees.find_one({"_id": user.committeeId})
        if committee and committee.get("name") in EXEC_OR_MAIN_COMMITTEE_NAMES:
            return {}
        return {"_id": user.committeeId}
    return {}


@router.get("")
async def list_committees(user: Annotated[AuthUser, Depends(require_auth)]):
    """List committees with organization category (for members, filters, etc.)."""
    query = await _scope_filter(user)
    rows = await get_db().committees.find(query).sort("category", 1).sort("name", 1).to_list(length=50)
    data = [doc for c in rows if (doc := serialize_doc(c))]
    return {"data": data}


async def _can_create_committee(user: AuthUser) -> bool:
    if user.tier == "MASTER":
        return True
    if user.tier != "LEADERSHIP" or not user.committeeId:
        return False
    committee = await get_db().committees.find_one({"_id": user.committeeId})
    return bool(committee and committee.get("name") in EXEC_OR_MAIN_COMMITTEE_NAMES)


@router.post("")
async def create_committee(
    body: dict,
    user: Annotated[AuthUser, Depends(require_role("MASTER", "LEADERSHIP"))],
):
    """Create a new society or group (affinity / SIGHT)."""
    if not await _can_create_committee(user):
        raise HTTPException(status_code=403, detail={"error": "Only executive or main SB leadership can create units"})

    short_name = (body.get("shortName") or body.get("name") or "").strip()
    category = (body.get("category") or "").strip().upper()
    year = (body.get("year") or "2026").strip()

    if not short_name:
        raise HTTPException(status_code=400, detail={"error": "shortName is required"})
    if category not in CREATABLE_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail={"error": f"category must be one of: {', '.join(CREATABLE_CATEGORIES)}"},
        )

    full_name = (body.get("fullName") or "").strip() or _build_committee_name(short_name, category)

    existing = await get_db().committees.find_one(
        {"$or": [{"name": full_name}, {"shortName": short_name, "category": category}]}
    )
    if existing:
        raise HTTPException(status_code=409, detail={"error": "A unit with this name already exists"})

    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id(),
        "name": full_name,
        "shortName": short_name,
        "category": category,
        "year": year,
        "status": "active",
        "createdAt": now,
    }
    await get_db().committees.insert_one(doc)
    return {"data": serialize_doc(doc)}
