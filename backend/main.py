from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import expenses, budgets, analytics, auth, import_export
from app.database import engine
from app.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Finance Tracker API",
    description="A comprehensive API for tracking personal finances, expenses, and budgets",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(import_export.router, prefix="/api/import-export", tags=["Import/Export"])

@app.get("/")
async def root():
    return {"message": "Personal Finance Tracker API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
