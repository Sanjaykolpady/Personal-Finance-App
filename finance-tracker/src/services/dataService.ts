import { 
  expensesAPI, 
  budgetsAPI, 
  analyticsAPI, 
  importExportAPI,
  convertAPIExpenseToFrontend,
  convertFrontendExpenseToAPI,
  type Expense
} from './api';

type Budgets = Record<string, number>;

export class DataService {
  private static instance: DataService;
  private expenses: Expense[] = [];
  private budgets: Budgets = {};
  private categories: string[] = [
    "Groceries",
    "Dining",
    "Transport",
    "Utilities",
    "Rent",
    "Entertainment",
    "Shopping",
    "Health",
    "Education",
    "Travel",
    "Other",
  ];

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Initialize default budgets
  private initializeBudgets(): void {
    this.categories.forEach(category => {
      if (!(category in this.budgets)) {
        this.budgets[category] = 0;
      }
    });
  }

  // Get all expenses with optional filtering
  async getExpenses(filters?: {
    month?: string;
    category?: string;
    need?: boolean;
    search?: string;
  }): Promise<Expense[]> {
    try {
      const apiExpenses = await expensesAPI.getAll(filters);
      this.expenses = apiExpenses.map(convertAPIExpenseToFrontend);
      return this.expenses;
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      return this.expenses; // Return cached data on error
    }
  }

  // Add new expense
  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    try {
      const apiExpense = await expensesAPI.create(convertFrontendExpenseToAPI(expense));
      const newExpense = convertAPIExpenseToFrontend(apiExpense);
      this.expenses.unshift(newExpense);
      return newExpense;
    } catch (error) {
      console.error('Failed to add expense:', error);
      throw error;
    }
  }

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    try {
      await expensesAPI.delete(parseInt(id));
      this.expenses = this.expenses.filter(e => e.id !== id);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      throw error;
    }
  }

  // Get budgets for a month
  async getBudgets(month: string): Promise<Budgets> {
    try {
      const apiBudgets = await budgetsAPI.getAll(month);
      this.budgets = {};
      
      // Initialize with default categories
      this.initializeBudgets();
      
      // Update with actual budget values
      apiBudgets.forEach(budget => {
        this.budgets[budget.category] = budget.amount;
      });
      
      return this.budgets;
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      this.initializeBudgets();
      return this.budgets;
    }
  }

  // Set budget for a category and month
  async setBudget(category: string, amount: number, month: string): Promise<void> {
    try {
      // Check if budget already exists
      const existingBudgets = await budgetsAPI.getAll(month);
      const existingBudget = existingBudgets.find(b => b.category === category);
      
      if (existingBudget) {
        await budgetsAPI.update(existingBudget.id, amount);
      } else {
        await budgetsAPI.create({
          category,
          amount,
          month
        });
      }
      
      this.budgets[category] = amount;
    } catch (error) {
      console.error('Failed to set budget:', error);
      throw error;
    }
  }

  // Get categories
  getCategories(): string[] {
    return [...this.categories];
  }

  // Get monthly analysis
  async getMonthlyAnalysis(month: string) {
    try {
      return await analyticsAPI.getMonthlyAnalysis(month);
    } catch (error) {
      console.error('Failed to get monthly analysis:', error);
      throw error;
    }
  }

  // Get savings suggestions
  async getSuggestions(month: string) {
    try {
      return await analyticsAPI.getSuggestions(month);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      throw error;
    }
  }

  // Import CSV
  async importCSV(file: File): Promise<{ message: string; imported_count: number }> {
    try {
      const result = await importExportAPI.importCSV(file);
      // Refresh expenses after import
      await this.getExpenses();
      return result;
    } catch (error) {
      console.error('Failed to import CSV:', error);
      throw error;
    }
  }

  // Export CSV
  async exportCSV(month?: string): Promise<void> {
    try {
      const blob = await importExportAPI.exportCSV(month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = month ? `expenses_${month}.csv` : `expenses_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw error;
    }
  }

  // Reset data (for demo purposes)
  resetData(): void {
    this.expenses = [];
    this.budgets = {};
    this.initializeBudgets();
  }

  // Get cached expenses
  getCachedExpenses(): Expense[] {
    return [...this.expenses];
  }

  // Get cached budgets
  getCachedBudgets(): Budgets {
    return { ...this.budgets };
  }
}

export const dataService = DataService.getInstance();
