# Personal Finance Tracker Backend

A FastAPI-based backend for the Personal Finance Tracker application, providing comprehensive APIs for expense management, budget tracking, and financial analytics.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Expense Management**: CRUD operations for expenses with categories, amounts, dates, and need/want classification
- **Budget Tracking**: Monthly budget management by category with overage alerts
- **Financial Analytics**: Comprehensive spending analysis, category breakdowns, and merchant analysis
- **Smart Insights**: AI-powered suggestions for saving money based on spending patterns
- **Data Import/Export**: CSV import/export functionality for bulk data management
- **Recurring Charge Detection**: Automatic detection of subscription-like spending patterns

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLAlchemy with SQLite (default) / PostgreSQL support
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Pydantic schemas
- **CORS**: Built-in CORS middleware for frontend integration

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///./finance_tracker.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App settings
DEBUG=true
```

### 3. Run the Application

```bash
# Option 1: Using the run script
python run.py

# Option 2: Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, you can access:
- **Interactive API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Expenses
- `POST /api/expenses/` - Create expense
- `GET /api/expenses/` - List expenses with filtering
- `GET /api/expenses/{id}` - Get specific expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

### Budgets
- `POST /api/budgets/` - Create budget
- `GET /api/budgets/` - List budgets
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget
- `GET /api/budgets/summary/{month}` - Get budget summary

### Analytics
- `GET /api/analytics/monthly/{month}` - Monthly analysis
- `GET /api/analytics/suggestions/{month}` - Savings suggestions

### Import/Export
- `POST /api/import-export/import-csv` - Import expenses from CSV
- `GET /api/import-export/export-csv` - Export expenses to CSV

## Database Schema

### Users
- `id`: Primary key
- `email`: Unique email address
- `username`: Unique username
- `hashed_password`: Bcrypt-hashed password
- `created_at`: Account creation timestamp

### Expenses
- `id`: Primary key
- `user_id`: Foreign key to users
- `date`: Expense date
- `amount`: Expense amount
- `category`: Expense category
- `merchant`: Merchant name
- `note`: Optional note
- `need`: Boolean (need vs want)
- `created_at`: Record creation timestamp

### Budgets
- `id`: Primary key
- `user_id`: Foreign key to users
- `category`: Budget category
- `amount`: Budget amount
- `month`: Month in YYYY-MM format
- `created_at`: Record creation timestamp

## Frontend Integration

The backend is configured with CORS to work with React development servers:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Create React App default)

## Development

### Adding New Endpoints

1. Create a new router file in `app/routers/`
2. Define your endpoints with proper validation schemas
3. Include the router in `main.py`
4. Add any new models to `app/models.py`
5. Update schemas in `app/schemas.py`

### Database Migrations

For production use, consider using Alembic for database migrations:

```bash
# Initialize Alembic
alembic init alembic

# Create a migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## Security Considerations

- Change the `SECRET_KEY` in production
- Use environment variables for sensitive configuration
- Consider rate limiting for production deployments
- Implement proper logging and monitoring
- Use HTTPS in production

## Production Deployment

For production deployment:

1. Use a production database (PostgreSQL recommended)
2. Set `DEBUG=false`
3. Use a proper WSGI server (Gunicorn + Uvicorn workers)
4. Implement proper logging
5. Set up monitoring and health checks
6. Use environment variables for configuration
7. Consider containerization with Docker

## License

This project is part of the Personal Finance Tracker application.
