# iTools — Executive Committee Operating System

A management portal for Executive Committees (e.g., Silver Oak University IEEE Student Branches).

## Project Structure

```
├── backend/          # Python (FastAPI) API + MongoDB
├── frontend/         # Next.js UI (own package.json / node_modules)
└── docker-compose.yml
```

Backend and frontend are **separate apps**. There is no `package.json` at the project root — run commands from `backend/` or `frontend/` directly.

---

## Local Development

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **MongoDB** (local or via Docker)

### 1. MongoDB

Use your local MongoDB on port `27017`, **or** start the Docker one on port `27018`:

```bash
docker compose up mongo -d
# then set in backend/.env:
# MONGO_URI=mongodb://itoolsmongo:itoolsmongopassword@localhost:27018/itools?authSource=admin
```

### 2. Backend (Python)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python seed.py                # first run only
python -m uvicorn app.main:app --reload --port 4000
```

API: [http://localhost:4000/health](http://localhost:4000/health)

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

UI: [http://localhost:3000](http://localhost:3000)

### Login (after seed)

All EC accounts use password **`admin123`** (configured via `DEFAULT_PASSWORD` in `backend/.env`).

- **Chairperson** (Aditya Soni): `chair@ieeesb.org`
- **Executive Chair** (Anurag Soliya): `anurag@ieeesb.org`
- **CS Chapter Chair** (Aaryan Vegda): `aaryan@ieeesb.org`
- **WIE Chair** (Setu Madhavani): `setu@ieeesb.org`

Seed includes all 33 EC members across 7 committees/chapters/groups.

---

## Docker (full stack)

```bash
docker compose up -d --build
docker compose exec backend python seed.py
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:4000](http://localhost:4000)

Stop:

```bash
docker compose down
```

---

## Configuration

| Variable | Service | Default |
|----------|---------|---------|
| `PORT` | backend | `4000` |
| `MONGO_URI` | backend | `mongodb://localhost:27017/itools` |
| `JWT_SECRET` | backend | `default_secret` |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | frontend | `http://localhost:4000` |
