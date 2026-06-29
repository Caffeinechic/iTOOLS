# iTools Backend

FastAPI REST API with MongoDB and Socket.IO for the iTools executive committee platform.

See the [root README](../README.md) for setup and [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for structure.

## Commands

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python seed.py                  # first run
python -m uvicorn app.main:app --reload --port 4000
```

## Structure

```
app/
├── main.py          # Application entry, CORS, Socket.IO
├── database.py      # MongoDB connection
├── auth.py          # JWT utilities
├── config.py        # Environment settings
└── routes/          # Domain route modules
    ├── auth.py
    ├── users.py
    ├── pipelines.py
    ├── tasks.py
    ├── budgets.py
    ├── communications.py
    ├── notifications.py
    ├── committees.py
    ├── roles.py
    └── system_settings.py
```

API base: `http://localhost:4000/api/v1`
