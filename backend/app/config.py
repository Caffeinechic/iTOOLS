import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "4000"))
JWT_SECRET = os.getenv("JWT_SECRET", "default_secret")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/itools")
NODE_ENV = os.getenv("NODE_ENV", "development")
