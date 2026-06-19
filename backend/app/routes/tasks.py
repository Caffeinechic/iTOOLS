from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from app.auth import AuthUser, require_auth
from app.database import get_db, new_id, serialize_doc, serialize_task

router = APIRouter(prefix="/tasks", tags=["tasks"])


async def enrich_task_counts(task: dict) -> dict:
    t_json = await serialize_task(task)
    comments = await get_db().taskcomments.count_documents({"taskId": task["_id"]})
    files = await get_db().taskfiles.count_documents({"taskId": task["_id"]})
    return {**t_json, "_count": {"comments": comments, "files": files}}


@router.get("/stats/overview")
async def task_stats(user: Annotated[AuthUser, Depends(require_auth)]):
    base: dict = {"deletedAt": None}
    if user.committeeId:
        pipelines = await get_db().pipelines.find({"committeeId": user.committeeId}).to_list(length=200)
        base["pipelineId"] = {"$in": [p["_id"] for p in pipelines]}
    now = datetime.now(timezone.utc)
    total = await get_db().tasks.count_documents(base)
    todo = await get_db().tasks.count_documents({**base, "status": "TODO"})
    in_progress = await get_db().tasks.count_documents({**base, "status": "IN_PROGRESS"})
    review = await get_db().tasks.count_documents({**base, "status": "REVIEW"})
    done = await get_db().tasks.count_documents({**base, "status": "DONE"})
    overdue = await get_db().tasks.count_documents(
        {**base, "status": {"$ne": "DONE"}, "deadline": {"$lt": now}}
    )
    return {"data": {"total": total, "todo": todo, "inProgress": in_progress, "review": review, "done": done, "overdue": overdue}}


@router.get("")
async def list_tasks(
    user: Annotated[AuthUser, Depends(require_auth)],
    pipelineId: str | None = None,
    status: str | None = None,
    assignedTo: str | None = None,
    priority: str | None = None,
):
    query: dict = {"deletedAt": None}
    if pipelineId:
        query["pipelineId"] = pipelineId
    if status:
        query["status"] = status
    if assignedTo:
        query["assignedTo"] = assignedTo
    if priority:
        query["priority"] = priority
    tasks = await get_db().tasks.find(query).sort("createdAt", 1).to_list(length=500)
    return {"data": [await enrich_task_counts(t) for t in tasks]}


@router.get("/{task_id}")
async def get_task(task_id: str, user: Annotated[AuthUser, Depends(require_auth)]):
    task = await get_db().tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    t_json = await serialize_task(task)
    comments = await get_db().taskcomments.find({"taskId": task_id}).sort("createdAt", 1).to_list(length=200)
    files = await get_db().taskfiles.find({"taskId": task_id}).sort("createdAt", -1).to_list(length=200)
    comment_rows = []
    for c in comments:
        row = serialize_doc(c)
        user_doc = await get_db().users.find_one({"_id": c.get("userId")})
        if user_doc:
            row["user"] = {"id": user_doc["_id"], "name": user_doc.get("name")}
        comment_rows.append(row)
    file_rows = []
    for f in files:
        row = serialize_doc(f)
        user_doc = await get_db().users.find_one({"_id": f.get("attachedBy")})
        if user_doc:
            row["user"] = {"id": user_doc["_id"], "name": user_doc.get("name")}
        file_rows.append(row)
    return {"data": {**t_json, "comments": comment_rows, "files": file_rows}}


@router.post("")
async def create_task(body: dict, user: Annotated[AuthUser, Depends(require_auth)]):
    now = datetime.now(timezone.utc)
    assigned_to = body.get("assignedTo")
    doc = {
        "_id": new_id(),
        "title": body["title"],
        "description": body.get("description"),
        "pipelineId": body.get("pipelineId"),
        "assignedTo": assigned_to or None,
        "createdBy": user.id,
        "priority": body.get("priority", "MEDIUM"),
        "status": body.get("status", "TODO"),
        "deadline": datetime.fromisoformat(body["deadline"].replace("Z", "+00:00")) if body.get("deadline") else None,
        "metadata": "{}",
        "createdAt": now,
        "updatedAt": now,
    }
    await get_db().tasks.insert_one(doc)
    if assigned_to and assigned_to != user.id:
        await get_db().notifications.insert_one(
            {
                "_id": new_id(),
                "senderId": user.id,
                "recipientId": assigned_to,
                "committeeId": user.committeeId,
                "type": "TASK_ASSIGNED",
                "scope": "PERSONAL",
                "message": f'You\'ve been assigned to task: "{body["title"]}"',
                "isRead": False,
                "sentAt": now,
            }
        )
    return {"data": await enrich_task_counts(doc)}


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    update: dict = {"updatedAt": datetime.now(timezone.utc)}
    for key in ("title", "description", "status", "priority"):
        if key in body:
            update[key] = body[key]
    if "assignedTo" in body:
        update["assignedTo"] = body["assignedTo"] or None
    if "deadline" in body:
        update["deadline"] = (
            datetime.fromisoformat(body["deadline"].replace("Z", "+00:00")) if body["deadline"] else None
        )
    updated = await get_db().tasks.find_one_and_update(
        {"_id": task_id},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    return {"data": await enrich_task_counts(updated)}


@router.patch("/{task_id}/move")
async def move_task(
    task_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    status_value = body.get("status")
    if not status_value:
        raise HTTPException(status_code=400, detail={"error": "Status is required"})
    valid = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"]
    if status_value not in valid:
        raise HTTPException(status_code=400, detail={"error": f"Invalid status. Must be one of: {', '.join(valid)}"})
    updated = await get_db().tasks.find_one_and_update(
        {"_id": task_id},
        {"$set": {"status": status_value, "updatedAt": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    return {"data": await enrich_task_counts(updated)}


@router.delete("/{task_id}")
async def delete_task(task_id: str, user: Annotated[AuthUser, Depends(require_auth)]):
    await get_db().tasks.update_one(
        {"_id": task_id},
        {"$set": {"deletedAt": datetime.now(timezone.utc)}},
    )
    return {"message": "Task deleted"}


@router.post("/{task_id}/comments")
async def add_comment(
    task_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    content = body.get("content")
    if not content:
        raise HTTPException(status_code=400, detail={"error": "Content is required"})
    now = datetime.now(timezone.utc)
    doc = {"_id": new_id(), "taskId": task_id, "userId": user.id, "content": content, "createdAt": now}
    await get_db().taskcomments.insert_one(doc)
    row = serialize_doc(doc)
    user_doc = await get_db().users.find_one({"_id": user.id})
    if user_doc:
        row["user"] = {"id": user_doc["_id"], "name": user_doc.get("name")}
    return {"data": row}


@router.get("/{task_id}/comments")
async def list_comments(task_id: str, user: Annotated[AuthUser, Depends(require_auth)]):
    comments = await get_db().taskcomments.find({"taskId": task_id}).sort("createdAt", 1).to_list(length=200)
    rows = []
    for c in comments:
        row = serialize_doc(c)
        user_doc = await get_db().users.find_one({"_id": c.get("userId")})
        if user_doc:
            row["user"] = {"id": user_doc["_id"], "name": user_doc.get("name")}
        rows.append(row)
    return {"data": rows}


@router.post("/{task_id}/files")
async def add_file(
    task_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    file_url = body.get("fileUrl")
    if not file_url:
        raise HTTPException(status_code=400, detail={"error": "fileUrl is required"})
    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id(),
        "taskId": task_id,
        "attachedBy": user.id,
        "fileName": body.get("fileName", "Untitled"),
        "fileUrl": file_url,
        "mimeType": body.get("mimeType", "application/octet-stream"),
        "createdAt": now,
    }
    await get_db().taskfiles.insert_one(doc)
    row = serialize_doc(doc)
    user_doc = await get_db().users.find_one({"_id": user.id})
    if user_doc:
        row["user"] = {"id": user_doc["_id"], "name": user_doc.get("name")}
    return {"data": row}
