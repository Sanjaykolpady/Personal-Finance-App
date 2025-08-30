from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Expense
from app.schemas import ExpenseCreate, ExpenseUpdate, Expense as ExpenseSchema
from app.dependencies import get_current_user_id

router = APIRouter()

@router.post("/", response_model=ExpenseSchema)
async def create_expense(
    expense: ExpenseCreate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new expense"""
    db_expense = Expense(
        **expense.dict(),
        user_id=current_user_id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/", response_model=List[ExpenseSchema])
async def get_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    month: Optional[str] = Query(None, regex=r"^\d{4}-\d{2}$"),
    category: Optional[str] = None,
    need: Optional[bool] = None,
    search: Optional[str] = None,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get expenses with optional filtering"""
    query = db.query(Expense).filter(Expense.user_id == current_user_id)
    
    if month:
        query = query.filter(Expense.date >= f"{month}-01").filter(Expense.date < f"{month}-31")
    if category:
        query = query.filter(Expense.category == category)
    if need is not None:
        query = query.filter(Expense.need == need)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Expense.merchant.ilike(search_filter)) |
            (Expense.note.ilike(search_filter)) |
            (Expense.category.ilike(search_filter))
        )
    
    expenses = query.order_by(Expense.date.desc()).offset(skip).limit(limit).all()
    return expenses

@router.get("/{expense_id}", response_model=ExpenseSchema)
async def get_expense(
    expense_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific expense by ID"""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return expense

@router.put("/{expense_id}", response_model=ExpenseSchema)
async def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update an expense"""
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user_id
    ).first()
    
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    update_data = expense_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete an expense"""
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user_id
    ).first()
    
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    db.delete(db_expense)
    db.commit()
    
    return {"message": "Expense deleted successfully"}
