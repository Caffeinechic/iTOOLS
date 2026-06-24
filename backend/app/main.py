from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import close_db, connect_db
from app.routes import auth, budgets, committees, communications, notifications, pipelines, roles, system_settings, tasks, users

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_db()
    yield
    await close_db()


api = FastAPI(lifespan=lifespan)
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

api.include_router(auth.router, prefix="/api/v1")
api.include_router(users.router, prefix="/api/v1")
api.include_router(roles.router, prefix="/api/v1")
api.include_router(pipelines.router, prefix="/api/v1")
api.include_router(tasks.router, prefix="/api/v1")
api.include_router(notifications.router, prefix="/api/v1")
api.include_router(communications.router, prefix="/api/v1")
api.include_router(committees.router, prefix="/api/v1")
api.include_router(budgets.router, prefix="/api/v1")
api.include_router(system_settings.router, prefix="/api/v1")


@api.get("/health")
async def health():
    return {"status": "ok"}


@sio.event
async def connect(sid, _environ):
    print(f"Socket connected: {sid}")


@sio.on("join:committee")
async def join_committee(sid, committee_id):
    await sio.enter_room(sid, f"committee:{committee_id}")


@sio.on("join:user")
async def join_user(sid, user_id):
    await sio.enter_room(sid, f"user:{user_id}")


@sio.event
async def disconnect(sid):
    print(f"Socket disconnected: {sid}")


app = socketio.ASGIApp(sio, other_asgi_app=api)
