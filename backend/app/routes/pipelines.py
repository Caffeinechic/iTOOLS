from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from app.auth import AuthUser, require_auth, require_role
from app.database import get_db, new_id, serialize_pipeline, serialize_task

router = APIRouter(prefix="/pipelines", tags=["pipelines"])


@router.get("")
async def list_pipelines(user: Annotated[AuthUser, Depends(require_auth)]):
    query = {"committeeId": user.committeeId} if user.committeeId else {}
    pipelines = await get_db().pipelines.find(query).sort("createdAt", -1).to_list(length=200)
    enriched = []
    for p in pipelines:
        p_json = await serialize_pipeline(p)
        total = await get_db().tasks.count_documents({"pipelineId": p["_id"], "deletedAt": None})
        status_counts: dict[str, int] = {}
        async for row in get_db().tasks.aggregate(
            [
                {"$match": {"pipelineId": p["_id"], "deletedAt": None}},
                {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            ]
        ):
            status_counts[row["_id"]] = row["count"]
        enriched.append({**p_json, "_count": {"tasks": total}, "statusCounts": status_counts})
    return {"data": enriched}


@router.get("/{pipeline_id}")
async def get_pipeline(pipeline_id: str, user: Annotated[AuthUser, Depends(require_auth)]):
    pipeline = await get_db().pipelines.find_one({"_id": pipeline_id})
    if not pipeline:
        raise HTTPException(status_code=404, detail={"error": "Pipeline not found"})
    tasks = (
        await get_db()
        .tasks.find({"pipelineId": pipeline_id, "deletedAt": None})
        .sort("createdAt", 1)
        .to_list(length=500)
    )
    task_rows = []
    for t in tasks:
        t_json = await serialize_task(t)
        comments = await get_db().taskcomments.count_documents({"taskId": t["_id"]})
        files = await get_db().taskfiles.count_documents({"taskId": t["_id"]})
        task_rows.append({**t_json, "_count": {"comments": comments, "files": files}})
    p_json = await serialize_pipeline(pipeline)
    return {"data": {**p_json, "tasks": task_rows}}


@router.post("")
async def create_pipeline(
    body: dict,
    user: Annotated[AuthUser, Depends(require_role("LEADERSHIP", "MASTER"))],
):
    from datetime import datetime, timezone

    doc = {
        "_id": new_id(),
        "title": body["title"],
        "description": body.get("description"),
        "type": body.get("type", "GENERAL"),
        "committeeId": user.committeeId,
        "roleId": body.get("roleId"),
        "createdAt": datetime.now(timezone.utc),
    }
    await get_db().pipelines.insert_one(doc)
    return {"data": await serialize_pipeline(doc)}


@router.patch("/{pipeline_id}")
async def update_pipeline(
    pipeline_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_role("LEADERSHIP", "MASTER"))],
):
    updated = await get_db().pipelines.find_one_and_update(
        {"_id": pipeline_id},
        {"$set": body},
        return_document=ReturnDocument.AFTER,
    )
    return {"data": await serialize_pipeline(updated) if updated else None}


@router.delete("/{pipeline_id}")
async def delete_pipeline(
    pipeline_id: str,
    user: Annotated[AuthUser, Depends(require_role("MASTER"))],
):
    await get_db().pipelines.delete_one({"_id": pipeline_id})
    return {"message": "Pipeline deleted"}
