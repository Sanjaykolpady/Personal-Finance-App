from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from datetime import datetime
from app.database import get_db
from app.models import Expense
from app.dependencies import get_current_user_id

router = APIRouter()

@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Import expenses from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    text = content.decode('utf-8')
    
    csv_reader = csv.DictReader(io.StringIO(text))
    imported_count = 0
    
    for row in csv_reader:
        try:
            date_obj = datetime.strptime(row['date'], '%Y-%m-%d').date()
            amount = float(row['amount'])
            need = row.get('need', 'need').lower().strip() in ['need', 'true', '1']
            
            expense = Expense(
                user_id=current_user_id,
                date=date_obj,
                amount=amount,
                category=row['category'].strip(),
                merchant=row['merchant'].strip(),
                note=row.get('note', '').strip(),
                need=need
            )
            
            db.add(expense)
            imported_count += 1
            
        except Exception as e:
            continue
    
    if imported_count > 0:
        db.commit()
    
    return {"message": f"Imported {imported_count} expenses", "imported_count": imported_count}

@router.get("/export-csv")
async def export_csv(
    month: str = None,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Export expenses to CSV file"""
    query = db.query(Expense).filter(Expense.user_id == current_user_id)
    
    if month:
        month_start = f"{month}-01"
        month_end = f"{month}-31"
        query = query.filter(Expense.date >= month_start).filter(Expense.date <= month_end)
    
    expenses = query.order_by(Expense.date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['date', 'amount', 'category', 'merchant', 'note', 'need'])
    
    for expense in expenses:
        writer.writerow([
            expense.date.strftime('%Y-%m-%d'),
            expense.amount,
            expense.category,
            expense.merchant,
            expense.note or '',
            'need' if expense.need else 'want'
        ])
    
    output.seek(0)
    csv_content = output.getvalue()
    
    filename = f"expenses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    if month:
        filename = f"expenses_{month}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
