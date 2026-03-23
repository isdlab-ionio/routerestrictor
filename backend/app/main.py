from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import segments, restrictions, dashboard, exports, seed

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Route Restrictor API",
    description="Municipal street restriction management for Corfu",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(segments.router, prefix="/api", tags=["segments"])
app.include_router(restrictions.router, prefix="/api", tags=["restrictions"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(exports.router, prefix="/api", tags=["export"])
app.include_router(seed.router, prefix="/api", tags=["seed"])


@app.get("/")
def root():
    return {"message": "Route Restrictor API - Corfu Municipality"}
