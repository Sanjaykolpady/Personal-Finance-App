from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Budget
from app.schemas import BudgetCreate, BudgetUpdate, Budget as BudgetSchema
from app.dependencies import get_current_user_id

router = APIRouter()

@router.post("/", response_model=BudgetSchema)
async def create_budget(
    budget: BudgetCreate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new budget for a category and month"""
    # Check if budget already exists for this category and month
    existing_budget = db.query(Budget).filter(
        Budget.user_id == current_user_id,
        Budget.category == budget.category,
        Budget.month == budget.month
    ).first()
    
    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget already exists for this category and month"
        )
    
    db_budget = Budget(
        **budget.dict(),
        user_id=current_user_id
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/", response_model=List[BudgetSchema])
async def get_budgets(
    month: Optional[str] = Query(None, regex=r"^\d{4}-\d{2}$"),
    category: Optional[str] = None,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get budgets with optional filtering"""
    query = db.query(Budget).filter(Budget.user_id == current_user_id)
    
    if month:
        query = query.filter(Budget.month == month)
    if category:
        query = query.filter(Budget.category == category)
    
    budgets = query.order_by(Budget.category).all()
    return budgets

@router.get("/{budget_id}", response_model=BudgetSchema)
async def get_budget(
    budget_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific budget by ID"""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user_id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return budget

@router.put("/{budget_id}", response_model=BudgetSchema)
async def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a budget"""
    db_budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user_id
    ).first()
    
    if not db_budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    update_data = budget_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_budget, field, value)
    
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a budget"""
    db_budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user_id
    ).first()
    
    if not db_budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    db.delete(db_budget)
    db.commit()
    
    return {"message": "Budget deleted successfully"}

@router.get("/summary/{month}", response_model=dict)
async def get_budget_summary(
    month: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get budget summary for a specific month"""
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user_id,
        Budget.month == month
    ).all()
    
    summary = {}
    for budget in budgets:
        summary[budget.category] = budget.amount
    
    return summary
