from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# User schemas
class UserBase(BaseModel):
    email: str = Field(..., description="User email address")
    username: str = Field(..., description="Username")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Expense schemas
class ExpenseBase(BaseModel):
    date: date
    amount: float = Field(..., gt=0, description="Expense amount")
    category: str
    merchant: str
    note: Optional[str] = None
    need: bool = True

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    merchant: Optional[str] = None
    note: Optional[str] = None
    need: Optional[bool] = None

class Expense(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Budget schemas
class BudgetBase(BaseModel):
    category: str
    amount: float = Field(..., ge=0, description="Budget amount")
    month: str = Field(..., patterns=r"^\d{4}-\d{2}$", description="Month in YYYY-MM format")

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount: float = Field(..., ge=0)

class Budget(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics schemas
class CategoryAnalysis(BaseModel):
    category: str
    amount: float

class MerchantAnalysis(BaseModel):
    merchant: str
    amount: float

class WantsNeedsAnalysis(BaseModel):
    want: float
    need: float

class BudgetFlag(BaseModel):
    category: str
    amount: float
    budget: float
    overBy: float

class SmallDrain(BaseModel):
    merchant: str
    count: int

class RecurringCharge(BaseModel):
    merchant: str
    mean: float
    months: int

class Analysis(BaseModel):
    inMonth: List[Expense]
    total: float
    catArr: List[CategoryAnalysis]
    topMerchants: List[MerchantAnalysis]
    wantsNeeds: WantsNeedsAnalysis
    budgetFlags: List[BudgetFlag]
    smallDrains: List[SmallDrain]
    outliers: List[Expense]
    recurring: List[RecurringCharge]

# Suggestion schemas
class Suggestion(BaseModel):
    title: str
    body: str
    impact: float

# Filter schemas
class ExpenseFilters(BaseModel):
    q: Optional[str] = None
    cat: Optional[str] = None
    need: Optional[str] = None
    month: Optional[str] = None

# Import/Export schemas
class CSVImportResponse(BaseModel):
    message: str
    imported_count: int
    errors: List[str] = []

class CSVExportResponse(BaseModel):
    csv_data: str
    filename: str
