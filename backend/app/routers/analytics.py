from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Dict, Any
from datetime import datetime, date
from app.database import get_db
from app.models import Expense, Budget
from app.schemas import Analysis, Suggestion
from app.dependencies import get_current_user_id

router = APIRouter()

@router.get("/monthly/{month}", response_model=Analysis)
async def get_monthly_analysis(
    month: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get comprehensive analysis for a specific month"""
    # Get expenses for the month
    month_start = f"{month}-01"
    month_end = f"{month}-31"
    
    expenses = db.query(Expense).filter(
        and_(
            Expense.user_id == current_user_id,
            Expense.date >= month_start,
            Expense.date <= month_end
        )
    ).all()
    
    if not expenses:
        return Analysis(
            inMonth=[],
            total=0,
            catArr=[],
            topMerchants=[],
            wantsNeeds={"want": 0, "need": 0},
            budgetFlags=[],
            smallDrains=[],
            outliers=[],
            recurring=[]
        )
    
    # Calculate total
    total = sum(exp.amount for exp in expenses)
    
    # Category analysis
    category_totals = {}
    for exp in expenses:
        category_totals[exp.category] = category_totals.get(exp.category, 0) + exp.amount
    
    cat_arr = [{"category": cat, "amount": amt} for cat, amt in category_totals.items()]
    cat_arr.sort(key=lambda x: x["amount"], reverse=True)
    
    # Merchant analysis
    merchant_totals = {}
    for exp in expenses:
        merchant_totals[exp.merchant] = merchant_totals.get(exp.merchant, 0) + exp.amount
    
    top_merchants = [{"merchant": merch, "amount": amt} for merch, amt in merchant_totals.items()]
    top_merchants.sort(key=lambda x: x["amount"], reverse=True)
    top_merchants = top_merchants[:5]
    
    # Wants vs Needs
    wants_needs = {"want": 0, "need": 0}
    for exp in expenses:
        if exp.need:
            wants_needs["need"] += exp.amount
        else:
            wants_needs["want"] += exp.amount
    
    # Budget flags
    budgets = db.query(Budget).filter(
        and_(
            Budget.user_id == current_user_id,
            Budget.month == month
        )
    ).all()
    
    budget_dict = {budget.category: budget.amount for budget in budgets}
    budget_flags = []
    
    for cat_analysis in cat_arr:
        if cat_analysis["category"] in budget_dict:
            budget = budget_dict[cat_analysis["category"]]
            if cat_analysis["amount"] > budget:
                budget_flags.append({
                    "category": cat_analysis["category"],
                    "amount": cat_analysis["amount"],
                    "budget": budget,
                    "overBy": cat_analysis["amount"] - budget
                })
    
    budget_flags.sort(key=lambda x: x["overBy"], reverse=True)
    
    # Small drains (non-essential expenses < 200)
    small_expenses = [exp for exp in expenses if not exp.need and exp.amount < 200]
    small_merchant_counts = {}
    for exp in small_expenses:
        small_merchant_counts[exp.merchant] = small_merchant_counts.get(exp.merchant, 0) + 1
    
    small_drains = [
        {"merchant": merch, "count": count}
        for merch, count in small_merchant_counts.items()
        if count >= 3
    ]
    small_drains.sort(key=lambda x: x["count"], reverse=True)
    
    # Outliers detection
    outliers = []
    for category in category_totals.keys():
        cat_expenses = [exp for exp in expenses if exp.category == category]
        if len(cat_expenses) >= 3:
            amounts = [exp.amount for exp in cat_expenses]
            mean = sum(amounts) / len(amounts)
            variance = sum((amt - mean) ** 2 for amt in amounts) / len(amounts)
            std_dev = variance ** 0.5
            
            if std_dev > 0:
                for exp in cat_expenses:
                    z_score = abs((exp.amount - mean) / std_dev)
                    if z_score > 2:
                        outliers.append(exp)
    
    # Recurring charges detection
    recurring = detect_recurring_charges(db, current_user_id)
    
    return Analysis(
        inMonth=expenses,
        total=total,
        catArr=cat_arr,
        topMerchants=top_merchants,
        wantsNeeds=wants_needs,
        budgetFlags=budget_flags,
        smallDrains=small_drains,
        outliers=outliers,
        recurring=recurring
    )

@router.get("/suggestions/{month}", response_model=List[Suggestion])
async def get_savings_suggestions(
    month: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get personalized savings suggestions for a month"""
    analysis = await get_monthly_analysis(month, current_user_id, db)
    suggestions = []
    
    # Suggestion 1: Trim wants
    if analysis.wantsNeeds.want > 0:
        ratio = (analysis.wantsNeeds.want / (analysis.total or 1)) * 100
        if ratio > 30:
            suggestions.append(Suggestion(
                title="Trim Wants",
                body=f"Your discretionary (wants) spend is {ratio:.0f}% of this month's expenses. Aim for 20–30%. Try a no-delivery week and make coffee at home.",
                impact=analysis.wantsNeeds.want * 0.2
            ))
    
    # Suggestion 2: Budget overages
    if analysis.budgetFlags:
        flag = analysis.budgetFlags[0]
        suggestions.append(Suggestion(
            title=f"Over Budget: {flag['category']}",
            body=f"You've exceeded the {flag['category']} budget by ₹{flag['overBy']:.0f}. Set a weekly cap of ₹{flag['budget']/4:.0f}.",
            impact=min(flag['overBy'], flag['amount'] * 0.25)
        ))
    
    # Suggestion 3: Small drains
    if analysis.smallDrains:
        drain = analysis.smallDrains[0]
        suggestions.append(Suggestion(
            title=f"Frequent small spends at {drain['merchant']}",
            body=f"You made {drain['count']}+ small purchases (< ₹200). Bundle purchases or set a daily limit of ₹100 for impulse buys.",
            impact=100 * drain['count'] * 0.4
        ))
    
    # Suggestion 4: Top merchant
    if analysis.topMerchants:
        top = analysis.topMerchants[0]
        suggestions.append(Suggestion(
            title=f"Top Merchant: {top['merchant']}",
            body=f"Consider alternatives or promo codes. Even a 10% reduction saves ₹{top['amount'] * 0.1:.0f} this month.",
            impact=top['amount'] * 0.1
        ))
    
    # Suggestion 5: Recurring charges
    high_recurring = [r for r in analysis.recurring if r.mean >= 200]
    if high_recurring:
        rec = high_recurring[0]
        suggestions.append(Suggestion(
            title=f"Recurring: {rec.merchant}",
            body=f"Looks recurring (~₹{rec.mean:.0f} / month). If unused, pause or downgrade.",
            impact=rec.mean
        ))
    
    suggestions.sort(key=lambda x: x.impact, reverse=True)
    return suggestions[:5]

def detect_recurring_charges(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """Detect recurring charges based on spending patterns"""
    expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
    
    merchant_months = {}
    for exp in expenses:
        month_key = exp.date.strftime("%Y-%m")
        if exp.merchant not in merchant_months:
            merchant_months[exp.merchant] = {}
        if month_key not in merchant_months[exp.merchant]:
            merchant_months[exp.merchant][month_key] = []
        merchant_months[exp.merchant][month_key].append(exp.amount)
    
    recurring = []
    for merchant, months in merchant_months.items():
        if len(months) >= 2:
            monthly_totals = [sum(amounts) for amounts in months.values()]
            mean = sum(monthly_totals) / len(monthly_totals)
            variance = sum((total - mean) ** 2 for total in monthly_totals) / len(monthly_totals)
            std_dev = variance ** 0.5
            
            if std_dev < mean * 0.3:
                recurring.append({
                    "merchant": merchant,
                    "mean": round(mean, 2),
                    "months": len(months)
                })
    
    recurring.sort(key=lambda x: x["mean"], reverse=True)
    return recurring
