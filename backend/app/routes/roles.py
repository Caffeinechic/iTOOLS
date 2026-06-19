from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import require_auth, require_role
from app.database import get_db, new_id, serialize_doc

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("")
async def list_roles(user: Annotated[object, Depends(require_auth)]):
    roles = await get_db().roles.find({}).to_list(length=200)
    rows = []
    for role in roles:
        row = serialize_doc(role)
        committee_id = role.get("committeeId")
        if committee_id:
            committee = await get_db().committees.find_one({"_id": committee_id})
            if committee:
                row["committee"] = serialize_doc(committee)
        rows.append(row)
    return {"data": rows}


@router.post("")
async def create_role(
    body: dict,
    user: Annotated[object, Depends(require_role("MASTER"))],
):
    from datetime import datetime, timezone

    doc = {**body, "_id": new_id(), "createdAt": datetime.now(timezone.utc)}
    await get_db().roles.insert_one(doc)
    return {"data": serialize_doc(doc)}
