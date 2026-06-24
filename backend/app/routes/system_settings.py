from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth import AuthUser, require_role
from app.database import get_db
from app.settings import (
    BOOTSTRAP_KEYS,
    SETTING_DEFINITIONS,
    delete_setting,
    load_settings_cache,
    serialize_setting,
    upsert_setting,
)

router = APIRouter(prefix="/system-settings", tags=["system-settings"])


@router.get("/definitions")
async def list_definitions(_: Annotated[AuthUser, Depends(require_role("MASTER"))]):
    return {
        "data": [
            {"key": key, **meta, "isBootstrap": key in BOOTSTRAP_KEYS}
            for key, meta in SETTING_DEFINITIONS.items()
        ]
    }


@router.get("")
async def list_settings(user: Annotated[AuthUser, Depends(require_role("MASTER"))]):
    docs = await get_db().system_settings.find().sort("key", 1).to_list(length=500)
    return {"data": [serialize_setting(doc) for doc in docs]}


@router.get("/{key}")
async def get_setting_detail(
    key: str,
    reveal: bool = False,
    _: Annotated[AuthUser, Depends(require_role("MASTER"))] = None,
):
    doc = await get_db().system_settings.find_one({"key": key.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Setting not found"})
    return {"data": serialize_setting(doc, reveal=reveal)}


@router.put("/{key}")
async def create_or_update_setting(
    key: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_role("MASTER"))],
):
    value = (body.get("value") or "").strip()
    if not value:
        raise HTTPException(status_code=400, detail={"error": "value is required"})

    try:
        doc = await upsert_setting(
            key.upper(),
            value,
            updated_by=user.id,
            category=body.get("category"),
            label=body.get("label"),
            description=body.get("description"),
            is_secret=body.get("isSecret"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc

    if key.upper() == "DEFAULT_PASSWORD":
        from app.database import _sync_default_passwords

        await _sync_default_passwords()

    return {"data": serialize_setting(doc)}


@router.delete("/{key}")
async def remove_setting(
    key: str,
    user: Annotated[AuthUser, Depends(require_role("MASTER"))],
):
    protected = {"JWT_SECRET", "DEFAULT_PASSWORD"}
    upper = key.upper()
    if upper in protected:
        raise HTTPException(
            status_code=400,
            detail={"error": f"{upper} is required and cannot be removed"},
        )
    try:
        deleted = await delete_setting(upper)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail={"error": "Setting not found"})
    await load_settings_cache()
    return {"ok": True}


@router.post("/reload")
async def reload_settings_cache(_: Annotated[AuthUser, Depends(require_role("MASTER"))]):
    await load_settings_cache()
    return {"ok": True, "message": "Runtime settings cache reloaded"}
