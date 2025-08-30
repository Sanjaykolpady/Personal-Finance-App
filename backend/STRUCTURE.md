# Backend Structure Overview

## Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py          # Configuration and environment variables
│   ├── database.py        # Database connection and session management
│   ├── models.py          # SQLAlchemy database models
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── auth.py            # Authentication utilities (JWT, password hashing)
│   ├── dependencies.py    # FastAPI dependencies and middleware
│   └── routers/           # API route handlers
│       ├── __init__.py
│       ├── auth.py        # Authentication endpoints
│       ├── expenses.py    # Expense management endpoints
│       ├── budgets.py     # Budget management endpoints
│       ├── analytics.py   # Financial analysis endpoints
│       └── import_export.py # CSV import/export endpoints
├── main.py                # FastAPI application entry point
├── run.py                 # Development server runner
├── requirements.txt       # Python dependencies
├── README.md              # Comprehensive documentation
├── STRUCTURE.md           # This file
├── test_api.py            # API testing script
├── start.sh               # Startup script for development
├── Dockerfile             # Docker containerization
└── docker-compose.yml     # Docker Compose configuration
```

## Key Components

### 1. FastAPI Application (`main.py`)
- Main application entry point
- CORS middleware configuration
- Router registration
- Health check endpoints

### 2. Database Layer
- **`database.py`**: SQLAlchemy engine and session management
- **`models.py`**: Database table definitions (User, Expense, Budget, Category)
- SQLite by default, PostgreSQL support ready

### 3. Authentication System
- **`auth.py`**: JWT token handling and password hashing
- **`dependencies.py`**: Authentication middleware and user extraction
- Secure password hashing with bcrypt
- JWT token-based authentication

### 4. API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user info

#### Expenses (`/api/expenses`)
- `POST /` - Create expense
- `GET /` - List expenses with filtering
- `GET /{id}` - Get specific expense
- `PUT /{id}` - Update expense
- `DELETE /{id}` - Delete expense

#### Budgets (`/api/budgets`)
- `POST /` - Create budget
- `GET /` - List budgets
- `PUT /{id}` - Update budget
- `DELETE /{id}` - Delete budget
- `GET /summary/{month}` - Get budget summary

#### Analytics (`/api/analytics`)
- `GET /monthly/{month}` - Comprehensive monthly analysis
- `GET /suggestions/{month}` - Personalized savings suggestions

#### Import/Export (`/api/import-export`)
- `POST /import-csv` - Import expenses from CSV
- `GET /export-csv` - Export expenses to CSV

### 5. Data Models

#### User
- Basic user information (email, username)
- Secure password storage
- Timestamps for audit trail

#### Expense
- Core expense data (date, amount, category, merchant)
- Need vs want classification
- Optional notes
- User association

#### Budget
- Monthly budget by category
- User-specific budgets
- Month-based organization (YYYY-MM format)

#### Category
- User-defined expense categories
- Flexible category management

### 6. Analytics Features

#### Monthly Analysis
- Total spending calculation
- Category breakdown
- Top merchants analysis
- Wants vs needs analysis
- Budget overage detection
- Small expense drain identification
- Outlier detection (statistical analysis)
- Recurring charge detection

#### Smart Suggestions
- Personalized savings recommendations
- Budget overage alerts
- Spending pattern insights
- Impact assessment for each suggestion

### 7. Security Features
- JWT token authentication
- Password hashing with bcrypt
- User isolation (users can only access their own data)
- Input validation with Pydantic
- CORS configuration for frontend integration

### 8. Development Tools
- **`start.sh`**: Automated setup and startup script
- **`test_api.py`**: API testing script
- **Docker support**: Containerization ready
- **Environment configuration**: Flexible configuration management

## API Response Format

All API responses follow a consistent format:
- Success responses return the requested data directly
- Error responses include HTTP status codes and error messages
- Authentication errors return 401 with WWW-Authenticate headers
- Validation errors return 422 with detailed field information

## Database Schema

The backend uses a relational database with the following key relationships:
- Users have many Expenses (one-to-many)
- Users have many Budgets (one-to-many)
- Users have many Categories (one-to-many)
- All data is isolated by user_id for security

## Frontend Integration

The backend is designed to work seamlessly with the React frontend:
- CORS configured for development servers
- JSON API responses
- File upload support for CSV import
- Streaming responses for CSV export
- Real-time data updates

## Scalability Considerations

- Modular router architecture for easy extension
- Database abstraction layer for multiple database support
- Environment-based configuration
- Docker containerization ready
- Health check endpoints for monitoring
- Comprehensive error handling and logging
