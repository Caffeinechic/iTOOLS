"""Seed MongoDB — Silver Oak University IEEE SB Executive Committee 2026."""

import asyncio
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import MONGO_URI
from app.credentials import DEFAULT_PASSWORD, password_hash
from app.database import new_id


def user(
    committee_id: str,
    role_id: str,
    name: str,
    email: str,
    now: datetime,
) -> dict:
    return {
        "_id": new_id(),
        "committeeId": committee_id,
        "roleId": role_id,
        "name": name,
        "email": email,
        "passwordHash": password_hash(),
        "isActive": True,
        "createdAt": now,
    }


def role(
    name: str,
    tier: str,
    committee_id: str | None = None,
    permissions: dict | None = None,
    responsibilities: list | None = None,
) -> dict:
    import json

    return {
        "_id": new_id(),
        "committeeId": committee_id,
        "name": name,
        "tier": tier,
        "permissions": json.dumps(permissions or {}),
        "responsibilities": json.dumps(responsibilities or []),
        "sops": "[]",
        "kpis": "[]",
        "isActive": True,
    }


async def main() -> None:
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_default_database()
    now = datetime.now(timezone.utc)

    print("Seeding Silver Oak University IEEE SB EC 2026...\n")
    print("Clearing collections...")
    for name in (
        "taskfiles",
        "taskcomments",
        "notifications",
        "aisessions",
        "tasks",
        "pipelines",
        "users",
        "roles",
        "committees",
    ):
        await db[name].delete_many({})

    # ── Committees ──────────────────────────────────────────────────────────
    com_exec = {
        "_id": new_id(),
        "name": "Executive Chairs",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_main = {
        "_id": new_id(),
        "name": "Silver Oak University IEEE Student Branch",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_coord = {
        "_id": new_id(),
        "name": "Student Branch Coordination",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_sps = {
        "_id": new_id(),
        "name": "SOU IEEE Signal Processing Society Chapter",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_cs = {
        "_id": new_id(),
        "name": "SOU IEEE Computer Society Chapter",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_wie = {
        "_id": new_id(),
        "name": "SOU IEEE Women In Engineering Affinity Group",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_sight = {
        "_id": new_id(),
        "name": "SOU IEEE SIGHT Group",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    await db.committees.insert_many(
        [com_exec, com_main, com_coord, com_sps, com_cs, com_wie, com_sight]
    )
    print("  7 committees created")

    # ── Roles ───────────────────────────────────────────────────────────────
    role_exec_chair = role(
        "Executive Chair",
        "MASTER",
        com_exec["_id"],
        {"all": True},
        ["Provides leadership", "Strategic direction", "Guidance for EC 2026"],
    )
    role_chair = role(
        "Chairperson",
        "LEADERSHIP",
        com_main["_id"],
        {"manageUsers": True, "managePipelines": True, "manageTasks": True},
        ["Overall management", "Represent student branch", "Lead initiatives"],
    )
    role_vice = role(
        "Vice Chairperson",
        "LEADERSHIP",
        com_main["_id"],
        {"managePipelines": True, "manageTasks": True},
        ["Support chairperson", "Coordination", "Chapter oversight"],
    )
    role_sec = role(
        "Secretary",
        "OPERATIONS",
        com_main["_id"],
        {"manageTasks": True, "viewReports": True},
        ["Documentation", "Communications", "Meeting minutes"],
    )
    role_tres = role(
        "Treasurer",
        "OPERATIONS",
        com_main["_id"],
        {"manageBudget": True, "viewReports": True},
        ["Budget planning", "Expense tracking", "Financial audits"],
    )
    role_web = role(
        "Webmaster",
        "OPERATIONS",
        com_main["_id"],
        {"manageTasks": True},
        ["Website maintenance", "Portal administration", "Digital assets"],
    )
    role_ch_chair = role(
        "Chapter Chairperson",
        "LEADERSHIP",
        permissions={"manageTasks": True},
        responsibilities=["Lead chapter activities", "Plan workshops"],
    )
    role_ch_vice = role(
        "Chapter Vice Chairperson",
        "LEADERSHIP",
        permissions={"manageTasks": True},
        responsibilities=["Support chapter chair", "Oversee events"],
    )
    role_ch_sec = role(
        "Chapter Secretary",
        "OPERATIONS",
        permissions={"viewTasks": True},
        responsibilities=["Document chapter meetings", "Manage roster"],
    )
    role_ch_tres = role(
        "Chapter Treasurer",
        "OPERATIONS",
        permissions={"viewTasks": True},
        responsibilities=["Manage chapter funds", "Budget requests"],
    )
    role_ch_web = role(
        "Chapter Webmaster",
        "OPERATIONS",
        permissions={"viewTasks": True},
        responsibilities=["Maintain chapter web presence"],
    )
    roles = [
        role_exec_chair,
        role_chair,
        role_vice,
        role_sec,
        role_tres,
        role_web,
        role_ch_chair,
        role_ch_vice,
        role_ch_sec,
        role_ch_tres,
        role_ch_web,
    ]
    await db.roles.insert_many(roles)
    print("  Roles initialized")

    # ── Executive Chairs ────────────────────────────────────────────────────
    exec_users = [
        user(com_exec["_id"], role_exec_chair["_id"], "Anurag Soliya", "anurag@ieeesb.org", now),
        user(com_exec["_id"], role_exec_chair["_id"], "Nisarg Chauhan", "nisarg@ieeesb.org", now),
        user(com_exec["_id"], role_exec_chair["_id"], "Prayas Chavda", "prayas@ieeesb.org", now),
        user(com_exec["_id"], role_exec_chair["_id"], "Sujal Patel", "sujal@ieeesb.org", now),
        user(com_exec["_id"], role_exec_chair["_id"], "Vraj Thakkar", "vraj@ieeesb.org", now),
    ]
    exec1 = exec_users[0]

    # ── Main Student Branch ─────────────────────────────────────────────────
    main_chair = user(com_main["_id"], role_chair["_id"], "Aditya Soni", "chair@ieeesb.org", now)
    main_vice = user(com_main["_id"], role_vice["_id"], "Jyotir Joshi", "jyotir@ieeesb.org", now)
    main_sec = user(com_main["_id"], role_sec["_id"], "Atharv Ambekar", "atharv@ieeesb.org", now)
    main_tres = user(com_main["_id"], role_tres["_id"], "Rishi Amrutiya", "rishi@ieeesb.org", now)
    main_web = user(com_main["_id"], role_web["_id"], "Gaurav Jangid", "gaurav@ieeesb.org", now)

    # ── Student Branch Coordination ───────────────────────────────────────
    coord_chair = user(com_coord["_id"], role_ch_chair["_id"], "Rishi Amrutiya", "rishi.coord@ieeesb.org", now)
    coord_vice = user(com_coord["_id"], role_ch_vice["_id"], "Dhruv Chavda", "dhruv@ieeesb.org", now)

    # ── SPS Chapter ───────────────────────────────────────────────────────
    sps_chair = user(com_sps["_id"], role_ch_chair["_id"], "Rishita Prajapati", "rishita@ieeesb.org", now)
    sps_vice = user(com_sps["_id"], role_ch_vice["_id"], "Dhyani Modi", "dhyani@ieeesb.org", now)
    sps_sec = user(com_sps["_id"], role_ch_sec["_id"], "Maruf Fatema Mansuri", "maruf@ieeesb.org", now)
    sps_tres = user(com_sps["_id"], role_ch_tres["_id"], "Dhruv Chavda", "dhruv.sps@ieeesb.org", now)
    sps_web = user(com_sps["_id"], role_ch_web["_id"], "Dhruvi Mandloi", "dhruvi@ieeesb.org", now)

    # ── CS Chapter ────────────────────────────────────────────────────────
    cs_chair = user(com_cs["_id"], role_ch_chair["_id"], "Aaryan Vegda", "aaryan@ieeesb.org", now)
    cs_vice = user(com_cs["_id"], role_ch_vice["_id"], "Max Patel", "max@ieeesb.org", now)
    cs_sec = user(com_cs["_id"], role_ch_sec["_id"], "Sayee Salokhe", "sayee@ieeesb.org", now)
    cs_tres = user(com_cs["_id"], role_ch_tres["_id"], "Manthan Davra", "manthan@ieeesb.org", now)
    cs_web = user(com_cs["_id"], role_ch_web["_id"], "Shivam Patel", "shivam@ieeesb.org", now)

    # ── WIE Affinity Group ──────────────────────────────────────────────────
    wie_chair = user(com_wie["_id"], role_ch_chair["_id"], "Setu Madhavani", "setu@ieeesb.org", now)
    wie_vice = user(com_wie["_id"], role_ch_vice["_id"], "Milan Sehgal", "milan@ieeesb.org", now)
    wie_sec = user(com_wie["_id"], role_ch_sec["_id"], "Mayuri Raghvani", "mayuri@ieeesb.org", now)
    wie_tres = user(com_wie["_id"], role_ch_tres["_id"], "Prince Sabalpara", "prince@ieeesb.org", now)
    wie_web = user(com_wie["_id"], role_ch_web["_id"], "Deep Khatri", "deep@ieeesb.org", now)

    # ── SIGHT Group ─────────────────────────────────────────────────────────
    sight_chair = user(com_sight["_id"], role_ch_chair["_id"], "Khushi Surti", "khushi@ieeesb.org", now)
    sight_vice = user(com_sight["_id"], role_ch_vice["_id"], "Tarang Prajapati", "tarang@ieeesb.org", now)
    sight_sec = user(com_sight["_id"], role_ch_sec["_id"], "Kapil Jangid", "kapil@ieeesb.org", now)
    sight_tres = user(com_sight["_id"], role_ch_tres["_id"], "Dheer Patel", "dheer@ieeesb.org", now)

    all_users = [
        *exec_users,
        main_chair,
        main_vice,
        main_sec,
        main_tres,
        main_web,
        coord_chair,
        coord_vice,
        sps_chair,
        sps_vice,
        sps_sec,
        sps_tres,
        sps_web,
        cs_chair,
        cs_vice,
        cs_sec,
        cs_tres,
        cs_web,
        wie_chair,
        wie_vice,
        wie_sec,
        wie_tres,
        wie_web,
        sight_chair,
        sight_vice,
        sight_sec,
        sight_tres,
    ]
    await db.users.insert_many(all_users)
    print(f"  {len(all_users)} EC members seeded")

    # ── Pipelines ───────────────────────────────────────────────────────────
    event_pipeline = {
        "_id": new_id(),
        "committeeId": com_main["_id"],
        "roleId": role_chair["_id"],
        "type": "EVENT",
        "title": "TechNova 2026 — Annual Hackathon",
        "description": "Complete planning and execution pipeline for our flagship 48-hour hackathon event.",
        "createdAt": now,
    }
    workshop_pipeline = {
        "_id": new_id(),
        "committeeId": com_cs["_id"],
        "roleId": role_ch_chair["_id"],
        "type": "WORKSHOP",
        "title": "AI/ML Workshop Series",
        "description": "4-part workshop series covering fundamentals to advanced topics in machine learning.",
        "createdAt": now,
    }
    outreach_pipeline = {
        "_id": new_id(),
        "committeeId": com_main["_id"],
        "roleId": role_vice["_id"],
        "type": "GENERAL",
        "title": "Membership Drive Q1",
        "description": "Outreach campaign to recruit new IEEE members from SOU batches.",
        "createdAt": now,
    }
    budget_pipeline = {
        "_id": new_id(),
        "committeeId": com_main["_id"],
        "roleId": role_tres["_id"],
        "type": "GENERAL",
        "title": "Budget Planning FY 2026",
        "description": "Annual budget allocation and approval workflow for all branch activities.",
        "createdAt": now,
    }
    await db.pipelines.insert_many(
        [event_pipeline, workshop_pipeline, outreach_pipeline, budget_pipeline]
    )
    print("  4 pipelines created")

    # ── Tasks (TechNova pipeline) ───────────────────────────────────────────
    tasks = [
        {
            "_id": new_id(),
            "pipelineId": event_pipeline["_id"],
            "title": "Book venue & logistics",
            "description": "Reserve SOU auditorium, arrange tables, WiFi, and power strips.",
            "status": "DONE",
            "priority": "HIGH",
            "assignedTo": main_vice["_id"],
            "createdBy": main_chair["_id"],
            "deadline": datetime(2026, 3, 15, tzinfo=timezone.utc),
            "metadata": "{}",
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "pipelineId": event_pipeline["_id"],
            "title": "Design event branding & posters",
            "description": "Create logo, banners, print posters, and email templates.",
            "status": "DONE",
            "priority": "MEDIUM",
            "assignedTo": main_web["_id"],
            "createdBy": main_chair["_id"],
            "deadline": datetime(2026, 3, 20, tzinfo=timezone.utc),
            "metadata": "{}",
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "pipelineId": event_pipeline["_id"],
            "title": "Secure sponsors (minimum 3)",
            "description": "Reach out to tech companies for sponsorship. Prepare deck.",
            "status": "IN_PROGRESS",
            "priority": "CRITICAL",
            "assignedTo": main_chair["_id"],
            "createdBy": exec1["_id"],
            "deadline": datetime(2026, 4, 1, tzinfo=timezone.utc),
            "metadata": "{}",
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "pipelineId": event_pipeline["_id"],
            "title": "Set up registration portal",
            "description": "Deploy registration form on SOU SB site.",
            "status": "IN_PROGRESS",
            "priority": "HIGH",
            "assignedTo": main_web["_id"],
            "createdBy": main_chair["_id"],
            "deadline": datetime(2026, 4, 5, tzinfo=timezone.utc),
            "metadata": "{}",
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "pipelineId": event_pipeline["_id"],
            "title": "Recruit mentors & judges",
            "description": "Invite industry professionals.",
            "status": "TODO",
            "priority": "HIGH",
            "assignedTo": main_vice["_id"],
            "createdBy": main_chair["_id"],
            "deadline": datetime(2026, 4, 10, tzinfo=timezone.utc),
            "metadata": "{}",
            "createdAt": now,
            "updatedAt": now,
        },
    ]
    await db.tasks.insert_many(tasks)
    print("  5 tasks seeded")

    await db.notifications.insert_one(
        {
            "_id": new_id(),
            "senderId": main_chair["_id"],
            "recipientId": main_vice["_id"],
            "committeeId": com_main["_id"],
            "type": "TASK_ASSIGNED",
            "scope": "PERSONAL",
            "message": 'You\'ve been assigned to task: "Book venue & logistics"',
            "isRead": False,
            "sentAt": now,
        }
    )
    await db.taskcomments.insert_one(
        {
            "_id": new_id(),
            "taskId": tasks[2]["_id"],
            "userId": main_chair["_id"],
            "content": "Sponsorship emails sent to stakeholders. Reviewing templates.",
            "createdAt": now,
        }
    )

    print("\nSeed complete!")
    print(f"  {len(all_users)} members | 7 committees | 4 pipelines | 5 tasks")
    print(f"  Default password for all accounts: {DEFAULT_PASSWORD}")
    print("  Login examples:")
    print("    chair@ieeesb.org        (Chairperson — Aditya Soni)")
    print("    anurag@ieeesb.org       (Executive Chair)")
    print("    aaryan@ieeesb.org       (CS Chapter Chair)")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
