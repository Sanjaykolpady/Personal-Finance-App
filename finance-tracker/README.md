# Personal Finance Tracker Frontend

A modern React-based frontend for the Personal Finance Tracker application, featuring comprehensive expense management, budget tracking, and financial analytics.

## Features

- **User Authentication**: Secure login and registration system
- **Expense Management**: Add, edit, delete expenses with categories and need/want classification
- **Budget Tracking**: Set monthly budgets by category with overage alerts
- **Financial Analytics**: Comprehensive spending analysis and insights
- **Smart Suggestions**: AI-powered savings recommendations
- **Data Import/Export**: CSV import/export functionality
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion
- **API Integration**: Fetch API with backend integration

## Backend Integration

This frontend is designed to work with the FastAPI backend. The backend provides:

- RESTful API endpoints for all operations
- JWT-based authentication
- SQLite/PostgreSQL database support
- Comprehensive financial analytics
- CSV import/export functionality

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see backend README)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

### Backend Setup

Make sure your FastAPI backend is running:

```bash
cd backend
python run.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   ├── Login.tsx      # Login component
│   ├── Register.tsx   # Registration component
│   ├── AuthWrapper.tsx # Authentication wrapper
│   └── ErrorBoundary.tsx # Error handling
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── services/           # API and data services
│   ├── api.ts         # API client functions
│   └── dataService.ts # Data management service
├── config.ts           # Configuration constants
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Authentication Flow

1. **Registration**: Users create accounts with email, username, and password
2. **Login**: Users authenticate with email and password
3. **JWT Tokens**: Secure authentication using JWT tokens
4. **Protected Routes**: All financial data requires authentication
5. **Logout**: Secure logout with token removal

## API Integration

The frontend communicates with the backend through:

- **RESTful APIs**: Standard HTTP methods for CRUD operations
- **JWT Authentication**: Secure token-based authentication
- **Error Handling**: Comprehensive error handling and user feedback
- **Data Synchronization**: Real-time data updates and caching

## Key Components

### AuthWrapper
- Manages authentication state
- Shows login/register forms for unauthenticated users
- Renders main app for authenticated users

### DataService
- Centralized data management
- API integration layer
- Caching and state management
- Error handling and fallbacks

### Main App
- Expense management interface
- Budget tracking and analytics
- Charts and visualizations
- Import/export functionality

## Environment Configuration

Create a `.env` file in the frontend root:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:8000/api

# Feature flags
REACT_APP_AUTH_ENABLED=true
REACT_APP_OFFLINE_MODE=false
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Serve the build folder**:
   ```bash
   npm run preview
   ```

3. **Deploy to your hosting service**:
   - Vercel, Netlify, or any static hosting
   - Update API configuration for production backend

## Troubleshooting

### Common Issues

1. **Backend Connection Error**:
   - Ensure backend is running on correct port
   - Check CORS configuration
   - Verify API base URL in config

2. **Authentication Issues**:
   - Clear browser storage
   - Check JWT token validity
   - Verify backend authentication endpoints

3. **Data Loading Issues**:
   - Check network requests in browser dev tools
   - Verify backend API responses
   - Check authentication token

### Debug Mode

Enable debug logging by setting in browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Personal Finance Tracker application.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review backend logs
3. Check browser console for errors
4. Verify API endpoints are working
