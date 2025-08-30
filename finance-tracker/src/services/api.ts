import { API_CONFIG } from '../config';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Types for API responses
export interface APIUser {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface APIToken {
  access_token: string;
  token_type: string;
}

export interface APIExpense {
  id: number;
  user_id: number;
  date: string;
  amount: number;
  category: string;
  merchant: string;
  note: string;
  need: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface APIBudget {
  id: number;
  user_id: number;
  category: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string | null;
}

export interface APIAnalysis {
  inMonth: APIExpense[];
  total: number;
  catArr: Array<{ category: string; amount: number }>;
  topMerchants: Array<{ merchant: string; amount: number }>;
  wantsNeeds: { want: number; need: number };
  budgetFlags: Array<{ category: string; amount: number; budget: number; overBy: number }>;
  smallDrains: Array<{ merchant: string; count: number }>;
  outliers: APIExpense[];
  recurring: Array<{ merchant: string; mean: number; months: number }>;
}

export interface APISuggestion {
  title: string;
  body: string;
  impact: number;
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Authentication API
export const authAPI = {
  register: async (email: string, username: string, password: string): Promise<APIUser> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  login: async (email: string, password: string): Promise<APIToken> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const tokenData = await response.json();
    localStorage.setItem('auth_token', tokenData.access_token);
    return tokenData;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<APIUser> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }
    
    return response.json();
  }
};

// Expenses API
export const expensesAPI = {
  create: async (expense: Omit<APIExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIExpense> => {
    const response = await fetch(`${API_BASE_URL}/expenses/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create expense: ${response.statusText}`);
    }
    
    return response.json();
  },

  getAll: async (filters?: {
    month?: string;
    category?: string;
    need?: boolean;
    search?: string;
  }): Promise<APIExpense[]> => {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.need !== undefined) params.append('need', filters.need.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response = await fetch(`${API_BASE_URL}/expenses/?${params}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get expenses: ${response.statusText}`);
    }
    
    return response.json();
  },

  update: async (id: number, updates: Partial<APIExpense>): Promise<APIExpense> => {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update expense: ${response.statusText}`);
    }
    
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete expense: ${response.statusText}`);
    }
  }
};

// Budgets API
export const budgetsAPI = {
  create: async (budget: Omit<APIBudget, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIBudget> => {
    const response = await fetch(`${API_BASE_URL}/budgets/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(budget)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create budget: ${response.statusText}`);
    }
    
    return response.json();
  },

  getAll: async (month?: string): Promise<APIBudget[]> => {
    const params = month ? `?month=${month}` : '';
    const response = await fetch(`${API_BASE_URL}/budgets/${params}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get budgets: ${response.statusText}`);
    }
    
    return response.json();
  },

  update: async (id: number, amount: number): Promise<APIBudget> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update budget: ${response.statusText}`);
    }
    
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete budget: ${response.statusText}`);
    }
  },

  getSummary: async (month: string): Promise<Record<string, number>> => {
    const response = await fetch(`${API_BASE_URL}/budgets/summary/${month}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get budget summary: ${response.statusText}`);
    }
    
    return response.json();
  }
};

// Analytics API
export const analyticsAPI = {
  getMonthlyAnalysis: async (month: string): Promise<APIAnalysis> => {
    const response = await fetch(`${API_BASE_URL}/analytics/monthly/${month}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get monthly analysis: ${response.statusText}`);
    }
    
    return response.json();
  },

  getSuggestions: async (month: string): Promise<APISuggestion[]> => {
    const response = await fetch(`${API_BASE_URL}/analytics/suggestions/${month}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get suggestions: ${response.statusText}`);
    }
    
    return response.json();
  }
};

// Import/Export API
export const importExportAPI = {
  importCSV: async (file: File): Promise<{ message: string; imported_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/import-export/import-csv`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to import CSV: ${response.statusText}`);
    }
    
    return response.json();
  },

  exportCSV: async (month?: string): Promise<Blob> => {
    const params = month ? `?month=${month}` : '';
    const response = await fetch(`${API_BASE_URL}/import-export/export-csv${params}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`);
    }
    
    return response.blob();
  }
};

// Utility function to convert API expense to frontend expense
export const convertAPIExpenseToFrontend = (apiExpense: APIExpense) => ({
  id: apiExpense.id.toString(),
  date: apiExpense.date,
  amount: apiExpense.amount,
  category: apiExpense.category,
  merchant: apiExpense.merchant,
  note: apiExpense.note,
  need: apiExpense.need
});

// Utility function to convert frontend expense to API expense
export const convertFrontendExpenseToAPI = (frontendExpense: Omit<Expense, 'id'>) => ({
  date: frontendExpense.date,
  amount: frontendExpense.amount,
  category: frontendExpense.category,
  merchant: frontendExpense.merchant,
  note: frontendExpense.note,
  need: frontendExpense.need
});

// Re-export the frontend Expense type for compatibility
export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  merchant: string;
  note: string;
  need: boolean;
}
