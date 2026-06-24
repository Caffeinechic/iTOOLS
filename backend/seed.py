"""Seed MongoDB — Silver Oak University IEEE SB Executive Committee 2026."""

import asyncio
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import MONGO_URI
from app.credentials import get_default_password, password_hash
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
    role_kind: str = "CHAPTER",
    permissions: dict | None = None,
    responsibilities: list | None = None,
) -> dict:
    import json

    return {
        "_id": new_id(),
        "committeeId": committee_id,
        "name": name,
        "tier": tier,
        "roleKind": role_kind,
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

    from app.settings import bootstrap_runtime_settings, load_settings_cache

    await bootstrap_runtime_settings(db)
    await load_settings_cache(db)

    print("Seeding Silver Oak University IEEE SB EC 2026...\n")
    print("Clearing collections...")
    for name in (
        "budget_transactions",
        "budgets",
        "communications",
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
        "shortName": "Executive Chairs",
        "category": "EXECUTIVE",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_main = {
        "_id": new_id(),
        "name": "Silver Oak University IEEE Student Branch",
        "shortName": "Main SB",
        "category": "STUDENT_BRANCH",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_coord = {
        "_id": new_id(),
        "name": "Student Branch Coordination",
        "shortName": "SB Coordination",
        "category": "STUDENT_BRANCH",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_sps = {
        "_id": new_id(),
        "name": "SOU IEEE Signal Processing Society Chapter",
        "shortName": "Signal Processing",
        "category": "SOCIETY",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_cs = {
        "_id": new_id(),
        "name": "SOU IEEE Computer Society Chapter",
        "shortName": "Computer Society",
        "category": "SOCIETY",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_wie = {
        "_id": new_id(),
        "name": "SOU IEEE Women In Engineering Affinity Group",
        "shortName": "Women In Engineering",
        "category": "AFFINITY_GROUP",
        "year": "2026",
        "status": "active",
        "createdAt": now,
    }
    com_sight = {
        "_id": new_id(),
        "name": "SOU IEEE SIGHT Group",
        "shortName": "SIGHT",
        "category": "GROUP",
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
        "MAIN",
        {"all": True},
        ["Provides leadership", "Strategic direction", "Guidance for EC 2026"],
    )
    role_chair = role(
        "Chairperson",
        "LEADERSHIP",
        com_main["_id"],
        "MAIN",
        {"manageUsers": True, "managePipelines": True, "manageTasks": True},
        ["Overall management", "Represent student branch", "Lead initiatives"],
    )
    role_vice = role(
        "Vice Chairperson",
        "LEADERSHIP",
        com_main["_id"],
        "MAIN",
        {"managePipelines": True, "manageTasks": True},
        ["Support chairperson", "Coordination", "Chapter oversight"],
    )
    role_sec = role(
        "Secretary",
        "LEADERSHIP",
        com_main["_id"],
        "MAIN",
        {"manageTasks": True, "viewReports": True},
        ["Documentation", "Communications", "Meeting minutes"],
    )
    role_tres = role(
        "Treasurer",
        "LEADERSHIP",
        com_main["_id"],
        "MAIN",
        {"manageBudget": True, "viewReports": True},
        ["Budget planning", "Expense tracking", "Financial audits"],
    )
    role_web = role(
        "Webmaster",
        "LEADERSHIP",
        com_main["_id"],
        "MAIN",
        {"manageTasks": True},
        ["Website maintenance", "Portal administration", "Digital assets"],
    )
    role_ch_chair = role(
        "Chapter Chairperson",
        "LEADERSHIP",
        role_kind="CHAPTER",
        permissions={"manageTasks": True, "manageUsers": True},
        responsibilities=["Lead chapter activities", "Plan workshops"],
    )
    role_ch_vice = role(
        "Chapter Vice Chairperson",
        "LEADERSHIP",
        role_kind="CHAPTER",
        permissions={"manageTasks": True},
        responsibilities=["Support chapter chair", "Oversee events"],
    )
    role_ch_sec = role(
        "Chapter Secretary",
        "LEADERSHIP",
        role_kind="CHAPTER",
        permissions={"viewTasks": True},
        responsibilities=["Document chapter meetings", "Manage roster"],
    )
    role_ch_tres = role(
        "Chapter Treasurer",
        "LEADERSHIP",
        role_kind="CHAPTER",
        permissions={"viewTasks": True, "manageBudget": True},
        responsibilities=["Manage chapter funds", "Budget requests"],
    )
    role_ch_web = role(
        "Chapter Webmaster",
        "LEADERSHIP",
        role_kind="CHAPTER",
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

    # ── Communications ──────────────────────────────────────────────────────
    comms = [
        {
            "_id": new_id(),
            "type": "ANNOUNCEMENT",
            "committeeId": com_main["_id"],
            "authorId": main_chair["_id"],
            "title": "TechNova 2026 — Registration Opens April 1",
            "content": "Registration for our flagship hackathon opens April 1. All chapter chairs should share the link with their members and encourage participation from first-year students.",
            "priority": "HIGH",
            "pinned": True,
            "parentId": None,
            "meetingDate": None,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "type": "ANNOUNCEMENT",
            "committeeId": com_main["_id"],
            "authorId": main_vice["_id"],
            "title": "Q1 Membership Drive Kickoff",
            "content": "The membership drive for Q1 2026 begins this week. Each chapter should submit their outreach plan to the Secretary by Friday.",
            "priority": "NORMAL",
            "pinned": False,
            "parentId": None,
            "meetingDate": None,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "type": "MEETING_MINUTES",
            "committeeId": com_main["_id"],
            "authorId": main_sec["_id"],
            "title": "EC Meeting — March 2026",
            "content": "Attendees: Chair, Vice Chair, Secretary, Treasurer, Webmaster.\n\nAgenda:\n1. TechNova 2026 planning status\n2. Budget approval for Q1 events\n3. Chapter coordination updates\n\nAction items assigned via pipelines.",
            "priority": "NORMAL",
            "pinned": False,
            "parentId": None,
            "meetingDate": datetime(2026, 3, 10, tzinfo=timezone.utc),
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "type": "MEETING_MINUTES",
            "committeeId": com_cs["_id"],
            "authorId": cs_sec["_id"],
            "title": "CS Chapter — Workshop Planning",
            "content": "Discussed AI/ML workshop series schedule. Four sessions planned: Python basics, NumPy/Pandas, scikit-learn intro, and a capstone project session.",
            "priority": "NORMAL",
            "pinned": False,
            "parentId": None,
            "meetingDate": datetime(2026, 3, 5, tzinfo=timezone.utc),
            "createdAt": now,
            "updatedAt": now,
        },
    ]
    discussion = {
        "_id": new_id(),
        "type": "DISCUSSION",
        "committeeId": com_main["_id"],
        "authorId": main_chair["_id"],
        "title": "Venue options for TechNova finals",
        "content": "We need to finalize the venue for TechNova finals. Options: Main Auditorium (500 cap) or CS Block Seminar Hall (200 cap). Thoughts?",
        "priority": "NORMAL",
        "pinned": False,
        "parentId": None,
        "meetingDate": None,
        "createdAt": now,
        "updatedAt": now,
    }
    comms.append(discussion)
    await db.communications.insert_many(comms)
    await db.communications.insert_many(
        [
            {
                "_id": new_id(),
                "type": "DISCUSSION",
                "committeeId": com_main["_id"],
                "authorId": main_vice["_id"],
                "title": f"Re: {discussion['title']}",
                "content": "Main Auditorium gives us more capacity for the demo day. I'd recommend booking it early.",
                "priority": "NORMAL",
                "pinned": False,
                "parentId": discussion["_id"],
                "meetingDate": None,
                "createdAt": now,
                "updatedAt": now,
            },
            {
                "_id": new_id(),
                "type": "DISCUSSION",
                "committeeId": com_main["_id"],
                "authorId": main_web["_id"],
                "title": f"Re: {discussion['title']}",
                "content": "CS Block has better WiFi infrastructure for live demos. Worth considering if we expect heavy network usage.",
                "priority": "NORMAL",
                "pinned": False,
                "parentId": discussion["_id"],
                "meetingDate": None,
                "createdAt": now,
                "updatedAt": now,
            },
        ]
    )
    print("  Communications seeded (announcements, minutes, discussions)")

    # ── Budget & finance ────────────────────────────────────────────────────
    main_budget = {
        "_id": new_id(),
        "committeeId": com_main["_id"],
        "fiscalYear": "2026",
        "allocatedAmount": 250000.0,
        "currency": "INR",
        "createdBy": main_chair["_id"],
        "createdAt": now,
        "updatedAt": now,
        "updatedBy": main_chair["_id"],
    }
    cs_budget = {
        "_id": new_id(),
        "committeeId": com_cs["_id"],
        "fiscalYear": "2026",
        "allocatedAmount": 75000.0,
        "currency": "INR",
        "createdBy": cs_chair["_id"],
        "createdAt": now,
        "updatedAt": now,
        "updatedBy": cs_chair["_id"],
    }
    await db.budgets.insert_many([main_budget, cs_budget])

    budget_txns = [
        {
            "_id": new_id(),
            "committeeId": com_main["_id"],
            "fiscalYear": "2026",
            "type": "INCOME",
            "amount": 50000.0,
            "category": "Sponsorship",
            "description": "TechNova title sponsor advance",
            "status": "APPROVED",
            "createdBy": main_chair["_id"],
            "approvedBy": main_chair["_id"],
            "approvedAt": now,
            "transactionDate": now,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "committeeId": com_main["_id"],
            "fiscalYear": "2026",
            "type": "EXPENSE",
            "amount": 18500.0,
            "category": "Events",
            "description": "Venue deposit — Main Auditorium",
            "status": "APPROVED",
            "createdBy": main_tres["_id"],
            "approvedBy": main_chair["_id"],
            "approvedAt": now,
            "transactionDate": now,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "committeeId": com_main["_id"],
            "fiscalYear": "2026",
            "type": "REIMBURSEMENT",
            "amount": 3200.0,
            "category": "Travel",
            "description": "Speaker travel reimbursement — workshop",
            "status": "PENDING",
            "createdBy": main_tres["_id"],
            "approvedBy": None,
            "approvedAt": None,
            "transactionDate": now,
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "_id": new_id(),
            "committeeId": com_cs["_id"],
            "fiscalYear": "2026",
            "type": "EXPENSE",
            "amount": 4500.0,
            "category": "Merchandise",
            "description": "Hackathon swag and badges",
            "status": "PENDING",
            "createdBy": cs_tres["_id"],
            "approvedBy": None,
            "approvedAt": None,
            "transactionDate": now,
            "createdAt": now,
            "updatedAt": now,
        },
    ]
    await db.budget_transactions.insert_many(budget_txns)
    await db.notifications.insert_one(
        {
            "_id": new_id(),
            "senderId": main_tres["_id"],
            "recipientId": main_chair["_id"],
            "committeeId": com_main["_id"],
            "type": "BUDGET",
            "scope": "PERSONAL",
            "message": "Budget approval needed: Reimbursement ₹3,200 — Speaker travel reimbursement — workshop",
            "isRead": False,
            "sentAt": now,
        }
    )
    print("  Budgets and transactions seeded")

    print("\nSeed complete!")
    print(f"  {len(all_users)} members | 7 committees | 4 pipelines | 5 tasks | 2 budgets")
    print(f"  Default password for all accounts: {get_default_password()}")
    print("  Login examples:")
    print("    chair@ieeesb.org        (Chairperson — Aditya Soni)")
    print("    anurag@ieeesb.org       (Executive Chair)")
    print("    aaryan@ieeesb.org       (CS Chapter Chair)")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
