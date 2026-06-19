from datetime import datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import MONGO_URI

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(MONGO_URI)
    _db = _client.get_default_database()
    await _db.command("ping")
    print(f"MongoDB connected: {_db.name}")
    await _sync_default_passwords()


async def _sync_default_passwords() -> None:
    from app.credentials import password_hash

    hashed = password_hash()
    result = await get_db().users.update_many(
        {"passwordHash": {"$ne": hashed}},
        {"$set": {"passwordHash": hashed}},
    )
    if result.modified_count:
        print(f"Synced {result.modified_count} user password(s) to default")


async def close_db() -> None:
    if _client:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not connected")
    return _db


def new_id() -> str:
    return str(uuid4())


def serialize_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    out: dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = value
        elif key == "__v":
            continue
        elif isinstance(value, datetime):
            out[key] = value.isoformat()
        else:
            out[key] = value
    return out


def serialize_date(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


async def find_by_id(collection: str, doc_id: str) -> dict[str, Any] | None:
    return await get_db()[collection].find_one({"_id": doc_id})


async def populate_user_fields(
    doc: dict[str, Any],
    *,
    user_field: str,
    alias: str | None = None,
    fields: tuple[str, ...] = ("name", "email"),
) -> dict[str, Any]:
    user_id = doc.get(user_field)
    if not user_id or not isinstance(user_id, str):
        return doc
    user = await find_by_id("users", user_id)
    if user:
        populated = {k: user.get(k) for k in ("_id", *fields) if k in user or k == "_id"}
        populated["id"] = populated.pop("_id")
        doc[alias or user_field.replace("Id", "").replace("To", "")] = populated
    return doc


async def serialize_user(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    out = serialize_doc(doc)
    assert out is not None
    role_id = out.get("roleId")
    committee_id = out.get("committeeId")
    if role_id:
        role = await find_by_id("roles", role_id)
        if role:
            out["role"] = serialize_doc(role)
    if committee_id:
        committee = await find_by_id("committees", committee_id)
        if committee:
            out["committee"] = serialize_doc(committee)
    return out


async def serialize_task(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    out = serialize_doc(doc)
    assert out is not None
    pipeline_id = out.get("pipelineId")
    assigned_to = out.get("assignedTo")
    created_by = out.get("createdBy")
    if pipeline_id:
        pipeline = await find_by_id("pipelines", pipeline_id)
        if pipeline:
            out["pipeline"] = {"id": pipeline["_id"], "title": pipeline.get("title")}
    if assigned_to:
        user = await find_by_id("users", assigned_to)
        if user:
            out["assignee"] = {"id": user["_id"], "name": user.get("name"), "email": user.get("email")}
    if created_by:
        user = await find_by_id("users", created_by)
        if user:
            out["creator"] = {"id": user["_id"], "name": user.get("name")}
    return out


async def serialize_pipeline(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    out = serialize_doc(doc)
    assert out is not None
    role_id = out.get("roleId")
    committee_id = out.get("committeeId")
    if role_id:
        role = await find_by_id("roles", role_id)
        if role:
            out["role"] = {"id": role["_id"], "name": role.get("name"), "tier": role.get("tier")}
    if committee_id:
        committee = await find_by_id("committees", committee_id)
        if committee:
            out["committee"] = {"id": committee["_id"], "name": committee.get("name")}
    return out


async def serialize_notification(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    out = serialize_doc(doc)
    assert out is not None
    sender_id = out.get("senderId")
    if sender_id:
        sender = await find_by_id("users", sender_id)
        if sender:
            out["sender"] = {"id": sender["_id"], "name": sender.get("name")}
    return out
