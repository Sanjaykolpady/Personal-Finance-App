# Personal Finance App - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [API Documentation](#api-documentation)
6. [Data Flow](#data-flow)
7. [File Structure & Descriptions](#file-structure--descriptions)
8. [Authentication Flow](#authentication-flow)
9. [Database Schema](#database-schema)
10. [Development Setup](#development-setup)

## Overview

The Personal Finance App is a full-stack web application designed to help users track expenses, manage budgets, and gain insights into their spending patterns. The application features a modern React frontend with a FastAPI backend, providing real-time financial analysis and personalized savings suggestions.

**Key Features:**
- Expense tracking with categorization (needs vs wants)
- Monthly budget management
- Financial analytics and insights
- CSV import/export functionality
- Responsive dashboard with charts and visualizations
- User authentication and data isolation

## System Architecture

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │    Backend      │
│   (React)       │                  │   (FastAPI)     │
│                 │                  │                 │
│ - User Interface│                  │ - REST API      │
│ - State Mgmt    │                  │ - Business Logic│
│ - Data Service  │                  │ - Database      │
│ - Auth Context  │                  │ - Authentication│
└─────────────────┘                  └─────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│   Local Storage │                  │   SQLite DB     │
│ - Auth Token    │                  │ - Users         │
│ - User Prefs    │                  │ - Expenses      │
└─────────────────┘                  │ - Budgets       │
                                     └─────────────────┘
```

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI (Python 3.9+)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **CORS**: Configured for frontend development servers

### Core Components

#### 1. Main Application (`main.py`)
- FastAPI app initialization
- CORS middleware configuration
- Router registration for all API endpoints
- Database table creation on startup

#### 2. Database Layer (`app/database.py`)
- SQLAlchemy engine configuration
- Database session management
- Connection pooling and optimization

#### 3. Models (`app/models.py`)
- SQLAlchemy ORM models for:
  - `User`: User accounts and authentication
  - `Expense`: Financial transactions
  - `Budget`: Monthly spending limits
  - `Category`: Expense categorization

#### 4. Authentication (`app/auth.py`)
- Password hashing with bcrypt
- JWT token generation and validation
- Security utilities and helpers

#### 5. Dependencies (`app/dependencies.py`)
- Dependency injection for database sessions
- Current user extraction from JWT tokens
- Authentication middleware

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Charts**: Recharts library
- **HTTP Client**: Native fetch API

### Core Components

#### 1. Application Structure (`App.tsx`)
- Main application component
- Dashboard layout and navigation
- Data management and state coordination
- Chart rendering and data visualization

#### 2. Authentication Context (`contexts/AuthContext.tsx`)
- User authentication state management
- Login/logout functionality
- Token storage and validation
- Auto-login on app startup

#### 3. Data Service (`services/dataService.ts`)
- Centralized data management
- API communication abstraction
- Data caching and synchronization
- Error handling and fallbacks

#### 4. API Service (`services/api.ts`)
- HTTP client implementation
- Type-safe API interfaces
- Authentication header management
- Data transformation utilities

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

#### POST `/api/auth/register`
- **Purpose**: User registration
- **Request Body**: `{ email, username, password }`
- **Response**: User object with ID and metadata
- **Flow**: Creates user account, hashes password, stores in database

#### POST `/api/auth/login`
- **Purpose**: User authentication
- **Request Body**: `{ email, password }`
- **Response**: `{ access_token, token_type }`
- **Flow**: Validates credentials, generates JWT token, returns for frontend storage

#### GET `/api/auth/me`
- **Purpose**: Get current user information
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current user object
- **Flow**: Validates JWT token, returns user data

### Expense Management Endpoints

#### POST `/api/expenses/`
- **Purpose**: Create new expense
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ date, amount, category, merchant, note, need }`
- **Response**: Created expense object
- **Flow**: Validates user, creates expense record, associates with user

#### GET `/api/expenses/`
- **Purpose**: Retrieve expenses with filtering
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**: `month`, `category`, `need`, `search`
- **Response**: Array of expense objects
- **Flow**: Applies filters, returns user-specific expenses

#### PUT `/api/expenses/{id}`
- **Purpose**: Update existing expense
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: Partial expense data
- **Response**: Updated expense object
- **Flow**: Validates ownership, updates record, returns updated data

#### DELETE `/api/expenses/{id}`
- **Purpose**: Delete expense
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Success message
- **Flow**: Validates ownership, removes from database

### Budget Management Endpoints

#### POST `/api/budgets/`
- **Purpose**: Create monthly budget
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ category, amount, month }`
- **Response**: Created budget object

#### GET `/api/budgets/`
- **Purpose**: Retrieve budgets for month
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**: `month`
- **Response**: Array of budget objects

### Analytics Endpoints

#### GET `/api/analytics/monthly/{month}`
- **Purpose**: Get comprehensive monthly analysis
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Analysis object with spending patterns, categories, merchants

#### GET `/api/analytics/suggestions/{month}`
- **Purpose**: Get personalized savings suggestions
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of suggestion objects with impact scores

## Data Flow

### 1. User Authentication Flow
```
Frontend → Login Form → API Service → Backend Auth → JWT Token → Local Storage
    ↓
Auth Context → User State → Protected Routes → Dashboard
```

### 2. Expense Management Flow
```
Dashboard → Add Expense Form → Data Service → API Service → Backend API
    ↓
Database Update → Response → Frontend State Update → UI Refresh
```

### 3. Data Synchronization Flow
```
App Startup → Auth Check → Load User Data → Fetch Expenses/Budgets
    ↓
Cache Data → Render Dashboard → Real-time Updates via API Calls
```

### 4. Analytics Flow
```
Month Selection → Data Service → Analytics API → Backend Processing
    ↓
Aggregate Data → Return Analysis → Frontend Charts → Visualization
```

## File Structure & Descriptions

### Backend Files

#### Core Application Files
- **`main.py`**: FastAPI application entry point, CORS configuration, router registration
- **`app/__init__.py`**: Package initialization
- **`app/config.py`**: Application configuration and environment variables

#### Database & Models
- **`app/database.py`**: SQLAlchemy database connection and session management
- **`app/models.py`**: SQLAlchemy ORM models for database tables
- **`app/schemas.py`**: Pydantic models for API request/response validation

#### Authentication & Security
- **`app/auth.py`**: Password hashing, JWT token generation, security utilities
- **`app/dependencies.py`**: FastAPI dependency injection for auth and database

#### API Routers
- **`app/routers/auth.py`**: User registration, login, and profile endpoints
- **`app/routers/expenses.py`**: CRUD operations for expense management
- **`app/routers/budgets.py`**: Budget creation, updates, and retrieval
- **`app/routers/analytics.py`**: Financial analysis and insights generation
- **`app/routers/import_export.py`**: CSV import/export functionality

### Frontend Files

#### Application Entry Points
- **`index.html`**: HTML template with root element
- **`src/main.tsx`**: React application bootstrap and rendering
- **`src/App.tsx`**: Main application component with dashboard layout

#### Core Services
- **`src/services/api.ts`**: HTTP client implementation and API endpoints
- **`src/services/dataService.ts`**: Data management and caching layer
- **`src/config.ts`**: Frontend configuration and constants

#### State Management
- **`src/contexts/AuthContext.tsx`**: Authentication state and user management
- **`src/components/AuthWrapper.tsx`**: Route protection and auth flow

#### UI Components
- **`src/components/Login.tsx`**: User authentication forms
- **`src/components/ui/`**: Reusable UI components (buttons, cards, inputs)
- **`src/components/ErrorBoundary.tsx`**: Error handling and fallback UI

#### Styling & Assets
- **`src/App.css`**: Global application styles
- **`src/assets/`**: Static assets and images
- **`src/lib/utils.ts`**: Utility functions and helpers

## Authentication Flow

### 1. User Registration
```
Frontend Form → API Call → Backend Validation → Password Hashing → Database Storage → Success Response
```

### 2. User Login
```
Frontend Form → API Call → Backend Validation → Password Verification → JWT Generation → Token Storage
```

### 3. Protected Route Access
```
Route Request → Auth Context Check → Token Validation → API Call → User Data → Route Access
```

### 4. Token Management
```
Local Storage → Auth Headers → API Requests → Backend Validation → User Context → Protected Resources
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    amount FLOAT NOT NULL,
    category VARCHAR NOT NULL,
    merchant VARCHAR NOT NULL,
    note TEXT,
    need BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Budgets Table
```sql
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category VARCHAR NOT NULL,
    amount FLOAT NOT NULL,
    month VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Development Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd finance-tracker
npm install
npm run dev
```

### Environment Configuration
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:5173`
- CORS configured for development servers
- SQLite database file: `backend/finance_tracker.db`

### API Testing
- Swagger UI available at `http://localhost:8000/docs`
- ReDoc available at `http://localhost:8000/redoc`
- Interactive API testing and documentation

## Key Features & Capabilities

### Real-time Analytics
- Monthly spending analysis
- Category-based breakdowns
- Merchant spending patterns
- Needs vs wants analysis
- Budget overage detection

### Smart Insights
- Recurring charge detection
- Outlier purchase identification
- Personalized savings suggestions
- Small spending leak detection

### Data Management
- CSV import/export functionality
- Bulk data operations
- Data validation and sanitization
- Backup and restore capabilities

### User Experience
- Responsive design for all devices
- Intuitive dashboard interface
- Real-time data updates
- Smooth animations and transitions
- Accessibility features

This documentation provides a comprehensive overview of the Personal Finance App's architecture, implementation details, and development workflow. The system is designed with scalability, security, and user experience in mind, following modern web development best practices.
