from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from app.auth import AuthUser, require_auth, require_role
from app.committees import EXEC_OR_MAIN_COMMITTEE_NAMES
from app.database import find_by_id, get_db, new_id, serialize_doc

router = APIRouter(prefix="/budget", tags=["budget"])

VALID_TYPES = ("INCOME", "EXPENSE", "REIMBURSEMENT")
VALID_STATUSES = ("PENDING", "APPROVED", "REJECTED")
VALID_CATEGORIES = ("Travel", "Events", "Merchandise", "Sponsorship", "Misc")
DEFAULT_FISCAL_YEAR = "2026"


async def _user_committee_name(user: AuthUser) -> str | None:
    if not user.committeeId:
        return None
    committee = await find_by_id("committees", user.committeeId)
    return committee.get("name") if committee else None


async def committee_scope_filter(user: AuthUser) -> dict[str, Any]:
    if user.tier == "MASTER":
        return {}
    name = await _user_committee_name(user)
    if name in EXEC_OR_MAIN_COMMITTEE_NAMES:
        return {}
    if user.committeeId:
        return {"committeeId": user.committeeId}
    return {}


async def assert_committee_access(user: AuthUser, committee_id: str) -> None:
    scope = await committee_scope_filter(user)
    if scope and scope.get("committeeId") != committee_id:
        raise HTTPException(status_code=403, detail={"error": "Permission denied for this committee"})


async def serialize_transaction(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    out = serialize_doc(doc)
    assert out is not None
    creator_id = out.get("createdBy")
    approver_id = out.get("approvedBy")
    committee_id = out.get("committeeId")
    if creator_id:
        creator = await find_by_id("users", creator_id)
        if creator:
            out["creator"] = {"id": creator["_id"], "name": creator.get("name")}
    if approver_id:
        approver = await find_by_id("users", approver_id)
        if approver:
            out["approver"] = {"id": approver["_id"], "name": approver.get("name")}
    if committee_id:
        committee = await find_by_id("committees", committee_id)
        if committee:
            out["committee"] = {"id": committee["_id"], "name": committee.get("name")}
    return out


async def serialize_budget(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    out = serialize_doc(doc)
    assert out is not None
    committee_id = out.get("committeeId")
    if committee_id:
        committee = await find_by_id("committees", committee_id)
        if committee:
            out["committee"] = {"id": committee["_id"], "name": committee.get("name")}
    return out


async def _sum_approved(committee_id: str, fiscal_year: str) -> dict[str, float]:
    pipeline = [
        {
            "$match": {
                "committeeId": committee_id,
                "fiscalYear": fiscal_year,
                "status": "APPROVED",
            }
        },
        {"$group": {"_id": "$type", "total": {"$sum": "$amount"}}},
    ]
    rows = await get_db().budget_transactions.aggregate(pipeline).to_list(length=10)
    totals = {r["_id"]: float(r["total"]) for r in rows}
    spent = totals.get("EXPENSE", 0) + totals.get("REIMBURSEMENT", 0)
    income = totals.get("INCOME", 0)
    return {"spent": spent, "income": income}


async def notify_user(sender_id: str, recipient_id: str, committee_id: str | None, message: str) -> None:
    if recipient_id == sender_id:
        return
    now = datetime.now(timezone.utc)
    await get_db().notifications.insert_one(
        {
            "_id": new_id(),
            "senderId": sender_id,
            "recipientId": recipient_id,
            "committeeId": committee_id,
            "type": "BUDGET",
            "scope": "PERSONAL",
            "message": message,
            "isRead": False,
            "sentAt": now,
        }
    )


async def notify_committee_leadership(
    sender_id: str,
    committee_id: str,
    message: str,
) -> None:
    leadership_roles = (
        await get_db().roles.find({"committeeId": committee_id, "tier": "LEADERSHIP"}).to_list(length=20)
    )
    if not leadership_roles:
        return
    role_ids = [r["_id"] for r in leadership_roles]
    leaders = (
        await get_db()
        .users.find({"committeeId": committee_id, "roleId": {"$in": role_ids}})
        .to_list(length=20)
    )
    for leader in leaders:
        await notify_user(sender_id, leader["_id"], committee_id, message)


@router.get("/committees")
async def list_budget_committees(user: Annotated[AuthUser, Depends(require_auth)]):
    """Committees the current user can view in the budget module."""
    scope = await committee_scope_filter(user)
    query: dict[str, Any] = {}
    if scope.get("committeeId"):
        query["_id"] = scope["committeeId"]
    rows = await get_db().committees.find(query).sort("name", 1).to_list(length=50)
    data = [doc for c in rows if (doc := serialize_doc(c))]
    return {"data": data}


@router.get("/summary")
async def budget_summary(
    user: Annotated[AuthUser, Depends(require_auth)],
    committeeId: str | None = None,
    fiscalYear: str = DEFAULT_FISCAL_YEAR,
):
    scope = await committee_scope_filter(user)
    target_committee = committeeId or user.committeeId
    if not target_committee:
        raise HTTPException(status_code=400, detail={"error": "committeeId is required"})
    await assert_committee_access(user, target_committee)

    budget = await get_db().budgets.find_one(
        {"committeeId": target_committee, "fiscalYear": fiscalYear}
    )
    allocated = float(budget["allocatedAmount"]) if budget else 0.0
    totals = await _sum_approved(target_committee, fiscalYear)
    pending_count = await get_db().budget_transactions.count_documents(
        {"committeeId": target_committee, "fiscalYear": fiscalYear, "status": "PENDING"}
    )
    remaining = allocated + totals["income"] - totals["spent"]
    committee = await find_by_id("committees", target_committee)
    return {
        "data": {
            "committeeId": target_committee,
            "committeeName": committee.get("name") if committee else None,
            "fiscalYear": fiscalYear,
            "allocated": allocated,
            "income": totals["income"],
            "spent": totals["spent"],
            "remaining": remaining,
            "pendingCount": pending_count,
            "budgetId": budget["_id"] if budget else None,
        }
    }


@router.get("")
async def list_budgets(
    user: Annotated[AuthUser, Depends(require_auth)],
    fiscalYear: str = DEFAULT_FISCAL_YEAR,
):
    query = {**await committee_scope_filter(user), "fiscalYear": fiscalYear}
    rows = await get_db().budgets.find(query).sort("createdAt", -1).to_list(length=50)
    return {"data": [await serialize_budget(r) for r in rows]}


@router.post("")
async def create_or_update_budget(
    body: dict,
    user: Annotated[AuthUser, Depends(require_role("MASTER", "LEADERSHIP"))],
):
    committee_id = body.get("committeeId") or user.committeeId
    if not committee_id:
        raise HTTPException(status_code=400, detail={"error": "committeeId is required"})
    await assert_committee_access(user, committee_id)

    fiscal_year = (body.get("fiscalYear") or DEFAULT_FISCAL_YEAR).strip()
    try:
        allocated = float(body.get("allocatedAmount", 0))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail={"error": "allocatedAmount must be a number"}) from exc
    if allocated < 0:
        raise HTTPException(status_code=400, detail={"error": "allocatedAmount must be non-negative"})

    now = datetime.now(timezone.utc)
    existing = await get_db().budgets.find_one(
        {"committeeId": committee_id, "fiscalYear": fiscal_year}
    )
    if existing:
        updated = await get_db().budgets.find_one_and_update(
            {"_id": existing["_id"]},
            {"$set": {"allocatedAmount": allocated, "updatedAt": now, "updatedBy": user.id}},
            return_document=ReturnDocument.AFTER,
        )
        return {"data": await serialize_budget(updated)}

    doc = {
        "_id": new_id(),
        "committeeId": committee_id,
        "fiscalYear": fiscal_year,
        "allocatedAmount": allocated,
        "currency": body.get("currency", "INR"),
        "createdBy": user.id,
        "createdAt": now,
        "updatedAt": now,
        "updatedBy": user.id,
    }
    await get_db().budgets.insert_one(doc)
    return {"data": await serialize_budget(doc)}


@router.get("/transactions")
async def list_transactions(
    user: Annotated[AuthUser, Depends(require_auth)],
    committeeId: str | None = None,
    fiscalYear: str = DEFAULT_FISCAL_YEAR,
    status: str | None = None,
):
    query: dict[str, Any] = {**await committee_scope_filter(user), "fiscalYear": fiscalYear}
    if committeeId:
        await assert_committee_access(user, committeeId)
        query["committeeId"] = committeeId
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail={"error": f"Invalid status. Use: {', '.join(VALID_STATUSES)}"})
        query["status"] = status

    rows = (
        await get_db()
        .budget_transactions.find(query)
        .sort("transactionDate", -1)
        .limit(100)
        .to_list(length=100)
    )
    return {"data": [await serialize_transaction(r) for r in rows]}


@router.post("/transactions")
async def create_transaction(
    body: dict,
    user: Annotated[AuthUser, Depends(require_auth)],
):
    committee_id = body.get("committeeId") or user.committeeId
    if not committee_id:
        raise HTTPException(status_code=400, detail={"error": "committeeId is required"})
    await assert_committee_access(user, committee_id)

    tx_type = (body.get("type") or "EXPENSE").upper()
    if tx_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail={"error": f"Invalid type. Use: {', '.join(VALID_TYPES)}"})

    category = body.get("category", "Misc")
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail={"error": f"Invalid category. Use: {', '.join(VALID_CATEGORIES)}"})

    description = (body.get("description") or "").strip()
    if not description:
        raise HTTPException(status_code=400, detail={"error": "description is required"})

    try:
        amount = float(body.get("amount", 0))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail={"error": "amount must be a number"}) from exc
    if amount <= 0:
        raise HTTPException(status_code=400, detail={"error": "amount must be greater than zero"})

    fiscal_year = (body.get("fiscalYear") or DEFAULT_FISCAL_YEAR).strip()
    now = datetime.now(timezone.utc)
    tx_date_raw = body.get("transactionDate")
    if tx_date_raw:
        tx_date = datetime.fromisoformat(str(tx_date_raw).replace("Z", "+00:00"))
    else:
        tx_date = now

    auto_approve = user.tier in ("MASTER", "LEADERSHIP")
    status = "APPROVED" if auto_approve else "PENDING"

    doc = {
        "_id": new_id(),
        "committeeId": committee_id,
        "fiscalYear": fiscal_year,
        "type": tx_type,
        "amount": amount,
        "category": category,
        "description": description,
        "status": status,
        "createdBy": user.id,
        "approvedBy": user.id if auto_approve else None,
        "approvedAt": now if auto_approve else None,
        "transactionDate": tx_date,
        "createdAt": now,
        "updatedAt": now,
    }
    await get_db().budget_transactions.insert_one(doc)

    if status == "PENDING":
        await notify_committee_leadership(
            user.id,
            committee_id,
            f'Budget approval needed: {tx_type.title()} ₹{amount:,.0f} — {description}',
        )

    return {"data": await serialize_transaction(doc)}


@router.patch("/transactions/{transaction_id}")
async def review_transaction(
    transaction_id: str,
    body: dict,
    user: Annotated[AuthUser, Depends(require_role("MASTER", "LEADERSHIP"))],
):
    action = (body.get("action") or "").strip().upper()
    if action not in ("APPROVE", "REJECT"):
        raise HTTPException(status_code=400, detail={"error": 'action must be "APPROVE" or "REJECT"'})

    tx = await get_db().budget_transactions.find_one({"_id": transaction_id})
    if not tx:
        raise HTTPException(status_code=404, detail={"error": "Transaction not found"})
    if tx.get("status") != "PENDING":
        raise HTTPException(status_code=400, detail={"error": "Transaction is not pending approval"})

    await assert_committee_access(user, tx["committeeId"])

    now = datetime.now(timezone.utc)
    new_status = "APPROVED" if action == "APPROVE" else "REJECTED"
    updated = await get_db().budget_transactions.find_one_and_update(
        {"_id": transaction_id},
        {
            "$set": {
                "status": new_status,
                "approvedBy": user.id,
                "approvedAt": now,
                "updatedAt": now,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    assert updated is not None

    creator_id = tx.get("createdBy")
    if creator_id:
        verb = "approved" if new_status == "APPROVED" else "rejected"
        await notify_user(
            user.id,
            creator_id,
            tx.get("committeeId"),
            f'Your {tx.get("type", "transaction").lower()} was {verb}: {tx.get("description", "")}',
        )

    return {"data": await serialize_transaction(updated)}
