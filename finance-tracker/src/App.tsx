import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, PlusCircle, Upload, Trash2, TrendingDown, Wallet, PieChart as PieIcon, BarChart3, CalendarDays, Filter, LogOut } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "./contexts/AuthContext";
import { AuthWrapper } from "./components/AuthWrapper";
import { dataService } from "./services/dataService";

// -------------------- Types --------------------
interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  merchant: string;
  note: string;
  need: boolean;
}

interface Budgets {
  [key: string]: number;
}

interface FinanceData {
  expenses: Expense[];
  categories: string[];
  budgets: Budgets;
}

interface Analysis {
  inMonth: Expense[];
  total: number;
  catArr: Array<{ category: string; amount: number }>;
  topMerchants: Array<{ merchant: string; amount: number }>;
  wantsNeeds: { want: number; need: number };
  budgetFlags: Array<{ category: string; amount: number; budget: number; overBy: number }>;
  smallDrains: Array<{ merchant: string; count: number }>;
  outliers: Expense[];
  recurring: Array<{ merchant: string; mean: number; months: number }>;
}

interface Suggestion {
  title: string;
  body: string;
  impact: number;
}

interface Filters {
  q: string;
  cat: string;
  need: string;
}

interface FormData {
  date: string;
  amount: string;
  category: string;
  merchant: string;
  note: string;
  need: boolean;
}

interface KPIProps {
  title: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}

interface AddExpenseFormProps {
  categories: string[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
}

const DEFAULT_CATEGORIES: string[] = [
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

const LOCAL_KEY = "finance_app_data_v1";



function currencyFormat(n: number, currency: string = "₹"): string {
  if (isNaN(n)) return `${currency}0`;
  return `${currency}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function monthKey(d: string): string {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function endOfMonth(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

// -------------------- Sample Data --------------------
// const SAMPLE_DATA: FinanceData = {
//   expenses: [
//     { id: "e1", date: new Date().toISOString().slice(0,10), amount: 250, category: "Transport", merchant: "Uber", note: "Office commute", need: true },
//     { id: "e2", date: new Date().toISOString().slice(0,10), amount: 1200, category: "Groceries", merchant: "Big Bazaar", note: "Weekly veg & fruits", need: true },
//     { id: "e3", date: new Date().toISOString().slice(0,10), amount: 399, category: "Dining", merchant: "Swiggy", note: "Lunch", need: false },
//     { id: "e4", date: new Date().toISOString().slice(0,10), amount: 999, category: "Entertainment", merchant: "Netflix", note: "Monthly subscription", need: false },
//   ],
//   categories: DEFAULT_CATEGORIES,
//   budgets: Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c, 0])),
// };

// -------------------- Helpers --------------------
function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

function detectRecurring(expenses: Expense[]): Array<{ merchant: string; mean: number; months: number }> {
  const byMerchant: { [key: string]: { [key: string]: Expense[] } } = {};
  for (const e of expenses) {
    const mk = monthKey(e.date);
    byMerchant[e.merchant] = byMerchant[e.merchant] || {};
    byMerchant[e.merchant][mk] = byMerchant[e.merchant][mk] || [];
    byMerchant[e.merchant][mk].push(e);
  }
  const rec: Array<{ merchant: string; mean: number; months: number }> = [];
  for (const [merchant, months] of Object.entries(byMerchant)) {
    const monthKeys = Object.keys(months).sort();
    if (monthKeys.length < 2) continue;
    const avg = (arr: number[]) => arr.reduce((a,b) => a+b, 0)/arr.length;
    const sums = monthKeys.map((m) => avg(months[m].map(e => e.amount)));
    const mean = avg(sums);
    const variance = avg(sums.map(s => (s-mean)**2));
    const stdev = Math.sqrt(variance);
    if (stdev < mean * 0.2) {
      rec.push({ merchant, mean: Math.round(mean), months: monthKeys.length });
    }
  }
  return rec.sort((a,b) => b.mean-a.mean);
}

function analyze(expenses: Expense[], budgets: Budgets, month: string): Analysis {
  const inMonth = expenses.filter((e) => monthKey(e.date) === month);
  const total = inMonth.reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCat: { [key: string]: number } = {};
  const byMerchant: { [key: string]: number } = {};
  const wantsNeeds = { want: 0, need: 0 };

  for (const e of inMonth) {
    byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
    byMerchant[e.merchant] = (byMerchant[e.merchant] || 0) + Number(e.amount);
    if (e.need) wantsNeeds.need += Number(e.amount);
    else wantsNeeds.want += Number(e.amount);
  }

  const catArr = Object.entries(byCat).map(([category, amount]) => ({ category, amount }));
  catArr.sort((a, b) => b.amount - a.amount);

  const topMerchants = Object.entries(byMerchant)
    .map(([merchant, amount]) => ({ merchant, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const budgetFlags = catArr
    .map((c) => ({
      ...c,
      budget: Number(budgets[c.category] || 0),
      overBy: Math.max(0, c.amount - Number(budgets[c.category] || 0)),
    }))
    .filter((c) => c.budget > 0 && c.amount > c.budget)
    .sort((a, b) => b.overBy - a.overBy);

  const smalls = inMonth.filter((e) => !e.need && e.amount < 200);
  const byMerchantSmall: { [key: string]: number } = {};
  for (const e of smalls) byMerchantSmall[e.merchant] = (byMerchantSmall[e.merchant] || 0) + 1;
  const smallDrains = Object.entries(byMerchantSmall)
    .filter(([, count]) => count >= 5)
    .map(([merchant, count]) => ({ merchant, count }));

  const outliers: Expense[] = [];
  for (const cat of new Set(inMonth.map((e) => e.category))) {
    const arr = inMonth.filter((e) => e.category === cat).map((e) => e.amount);
    if (arr.length < 3) continue;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sd = Math.sqrt(arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length);
    inMonth
      .filter((e) => e.category === cat)
      .forEach((e) => {
        if (sd > 0 && Math.abs((e.amount - mean) / sd) > 2) outliers.push(e);
      });
  }

  return {
    inMonth,
    total,
    catArr,
    topMerchants,
    wantsNeeds,
    budgetFlags,
    smallDrains,
    outliers,
    recurring: detectRecurring(expenses),
  };
}

// -------------------- Component --------------------
export default function App(): JSX.Element {
  return (
    <AuthWrapper>
      <FinanceTracker />
    </AuthWrapper>
  );
}

function FinanceTracker(): JSX.Element {
  const { user, logout } = useAuth();
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [data, setData] = useState<FinanceData>({ expenses: [], categories: [], budgets: {} });
  const [month, setMonth] = useState<string>(defaultMonth);
  const [filters, setFilters] = useState<Filters>({ q: "", cat: "All", need: "All" });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expenses, budgets] = await Promise.all([
        dataService.getExpenses(),
        dataService.getBudgets(month)
      ]);
      
      setData({
        expenses,
        categories: dataService.getCategories(),
        budgets
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback to sample data
      setData(SAMPLE_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  const addExpense = async (exp: Omit<Expense, 'id'>): Promise<void> => {
    try {
      const newExpense = await dataService.addExpense(exp);
      setData(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    try {
      await dataService.deleteExpense(id);
      setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const analysis = useMemo(() => analyze(data.expenses, data.budgets, month), [data.expenses, data.budgets, month]);

  const filteredRows = analysis.inMonth.filter((e) => {
    const q = filters.q.toLowerCase();
    const matchesQ = [e.merchant, e.note, e.category].some((x) => (x || "").toLowerCase().includes(q));
    const matchesCat = filters.cat === "All" || e.category === filters.cat;
    const matchesNeed = filters.need === "All" || (filters.need === "Need" ? e.need : !e.need);
    return matchesQ && matchesCat && matchesNeed;
  });

  const exportCSV = async (): Promise<void> => {
    try {
      await dataService.exportCSV(month);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const importCSV = async (file: File): Promise<void> => {
    try {
      const result = await dataService.importCSV(file);
      alert(`Successfully imported ${result.imported_count} expenses`);
      // Refresh data after import
      await loadData();
    } catch (error) {
      console.error('Failed to import CSV:', error);
      alert('Failed to import CSV. Please try again.');
    }
  };

  const resetAll = (): void => {
    dataService.resetData();
    setData(SAMPLE_DATA);
  };

  const setBudget = async (cat: string, val: string): Promise<void> => {
    try {
      const amount = Number(val) || 0;
      await dataService.setBudget(cat, amount, month);
      setData(prev => ({ ...prev, budgets: { ...prev.budgets, [cat]: amount } }));
    } catch (error) {
      console.error('Failed to set budget:', error);
      alert('Failed to set budget. Please try again.');
    }
  };

  const suggestions = useMemo((): Suggestion[] => {
    const list: Suggestion[] = [];
    if (analysis.wantsNeeds.want > 0) {
      const ratio = (analysis.wantsNeeds.want / (analysis.total || 1)) * 100;
      list.push({
        title: "Trim Wants",
        body: `Your discretionary (wants) spend is ${ratio.toFixed(0)}% of this month's expenses. Aim for 20–30%. Try a no-delivery week and make coffee at home.`,
        impact: analysis.wantsNeeds.want * 0.2,
      });
    }
    if (analysis.budgetFlags.length) {
      const b = analysis.budgetFlags[0];
      list.push({
        title: `Over Budget: ${b.category}`,
        body: `You've exceeded the ${b.category} budget by ${currencyFormat(b.overBy)}. Set a weekly cap of ${currencyFormat(Math.ceil((b.budget)/4))}.`,
        impact: Math.min(b.overBy, b.amount * 0.25),
      });
    }
    if (analysis.smallDrains.length) {
      const s = analysis.smallDrains[0];
      list.push({
        title: `Frequent small spends at ${s.merchant}`,
        body: `You made ${s.count}+ small purchases (< ₹200). Bundle purchases or set a daily limit of ₹100 for impulse buys.`,
        impact: 100 * s.count * 0.4,
      });
    }
    if (analysis.topMerchants[0]) {
      const t = analysis.topMerchants[0];
      list.push({
        title: `Top Merchant: ${t.merchant}`,
        body: `Consider alternatives or promo codes. Even a 10% reduction saves ${currencyFormat(t.amount * 0.1)} this month.`,
        impact: t.amount * 0.1,
      });
    }
    const rec = analysis.recurring.filter((r) => r.mean >= 200);
    if (rec.length) {
      const r = rec[0];
      list.push({
        title: `Recurring: ${r.merchant}`,
        body: `Looks recurring (~${currencyFormat(r.mean)} / month). If unused, pause or downgrade.`,
        impact: r.mean,
      });
    }
    return list.sort((a,b) => b.impact-a.impact).slice(0,5);
  }, [analysis]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Wallet className="h-8 w-8" /> Personal Finance Coach
            </h1>
            <p className="text-slate-600">Track daily expenses, spot leaks, and get tailored suggestions to lower your monthly spending.</p>
            {user && (
              <p className="text-sm text-slate-500">Welcome back, {user.username}!</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCSV}><Download className="mr-2 h-4 w-4"/>Export</Button>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && importCSV(e.target.files[0])} />
              <span className="px-3 py-2 rounded-2xl bg-white shadow hover:shadow-md text-sm inline-flex items-center gap-2"><Upload className="h-4 w-4"/>Import CSV</span>
            </label>
            <Button variant="destructive" onClick={resetAll}><Trash2 className="mr-2 h-4 w-4"/>Reset</Button>
            <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4"/>Logout</Button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5"/>Add Expense</CardTitle>
              <CardDescription>Log daily spends with need vs want.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddExpenseForm categories={data.categories} onAdd={addExpense} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5"/>Focus Month</CardTitle>
              <CardDescription>Analyze a specific month.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Input 
                type="month" 
                value={month} 
                onChange={async (e) => {
                  const newMonth = e.target.value;
                  setMonth(newMonth);
                  // Reload data for the new month
                  try {
                    const [expenses, budgets] = await Promise.all([
                      dataService.getExpenses({ month: newMonth }),
                      dataService.getBudgets(newMonth)
                    ]);
                    setData(prev => ({ ...prev, expenses, budgets }));
                  } catch (error) {
                    console.error('Failed to load data for month:', error);
                  }
                }} 
                className="max-w-xs"
              />
              <Badge variant="secondary">{startOfMonth(`${month}-01`)} → {endOfMonth(`${month}-01`)}</Badge>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/>Filters</CardTitle>
              <CardDescription>Search & narrow the table.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Search merchant / note / category" value={filters.q} onChange={(e) => setFilters({...filters, q: e.target.value})}/>
              <div className="flex gap-2">
                <Select value={filters.cat} onValueChange={(v) => setFilters({...filters, cat:v})}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Category"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {data.categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filters.need} onValueChange={(v) => setFilters({...filters, need:v})}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Need/Want"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Need">Need</SelectItem>
                    <SelectItem value="Want">Want</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-4">
          <KPI title="This Month Total" value={currencyFormat(analysis.total)} icon={<BarChart3 className="h-5 w-5"/>} />
          <KPI title="Needs" value={currencyFormat(analysis.wantsNeeds.need)} sub={`${((analysis.wantsNeeds.need/(analysis.total||1))*100).toFixed(0)}%`} />
          <KPI title="Wants" value={currencyFormat(analysis.wantsNeeds.want)} sub={`${((analysis.wantsNeeds.want/(analysis.total||1))*100).toFixed(0)}%`} />
          <KPI title="Top Category" value={analysis.catArr[0]?.category || "—"} sub={currencyFormat(analysis.catArr[0]?.amount||0)} />
        </div>

        {/* Insights & Budgets */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PieIcon className="h-5 w-5"/>Where Your Money Goes</CardTitle>
              <CardDescription>Category split for {month}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.catArr}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={(d: any) => `${d.category}: ${Math.round((d.amount/(analysis.total||1))*100)}%`}
                    >
                      {analysis.catArr.map((_, idx) => (<Cell key={idx} />))}
                    </Pie>
                    <Tooltip formatter={(v: any) => currencyFormat(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5"/>Savings Playbook</CardTitle>
              <CardDescription>Highest-impact suggestions first.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.length === 0 && <p className="text-sm text-slate-600">Add a few more expenses to see personalized suggestions.</p>}
              {suggestions.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-3 bg-white rounded-xl shadow border">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-slate-600">{s.body}</div>
                  <div className="mt-1 text-xs text-green-700">Potential monthly impact ≈ {currencyFormat(Math.round(s.impact))}</div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Merchants</CardTitle>
              <CardDescription>Where you spent the most this month.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.topMerchants}>
                  <XAxis dataKey="merchant"/>
                  <YAxis/>
                  <Tooltip formatter={(v: any) => currencyFormat(Number(v))} />
                  <Bar dataKey="amount" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Wants vs Needs</CardTitle>
              <CardDescription>Discretionary vs essential spend.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{name: 'Needs', value: analysis.wantsNeeds.need}, {name:'Wants', value: analysis.wantsNeeds.want}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                    <Cell />
                    <Cell />
                  </Pie>
                  <Tooltip formatter={(v: any) => currencyFormat(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Budgets */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Budgets by Category</CardTitle>
            <CardDescription>Set targets and see overages highlighted automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.categories.map((c) => {
                const spent = analysis.catArr.find((x) => x.category === c)?.amount || 0;
                const budget = Number(data.budgets[c] || 0);
                const over = budget > 0 && spent > budget;
                return (
                  <div key={c} className={`p-3 rounded-xl border bg-white ${over ? 'ring-2 ring-red-300' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{c}</div>
                      {over ? <Badge variant="destructive">Over by {currencyFormat(spent - budget)}</Badge> : <Badge variant="secondary">{currencyFormat(spent)} / {currencyFormat(budget)}</Badge>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Input type="number" min={0} placeholder="₹0" value={data.budgets[c] || ""} onChange={(e) => setBudget(c, e.target.value)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recurring & Outliers */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Detected Recurring Charges</CardTitle>
              <CardDescription>Potential subscriptions or monthly bills.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Avg / Month</TableHead>
                    <TableHead>Months</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.recurring.filter(r => r.mean>=200).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.merchant}</TableCell>
                      <TableCell>{currencyFormat(r.mean)}</TableCell>
                      <TableCell>{r.months}</TableCell>
                    </TableRow>
                  ))}
                  {analysis.recurring.filter(r => r.mean>=200).length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-slate-500">No recurring charges found yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Outlier Purchases</CardTitle>
              <CardDescription>Unusually large in a category.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.outliers.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell>{e.merchant}</TableCell>
                      <TableCell>{currencyFormat(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {analysis.outliers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-slate-500">No outliers detected.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Expenses ({filteredRows.length})</CardTitle>
            <CardDescription>From {startOfMonth(`${month}-01`)} to {endOfMonth(`${month}-01`)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Need?</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{e.date}</TableCell>
                      <TableCell>{currencyFormat(e.amount)}</TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell>{e.merchant}</TableCell>
                      <TableCell>
                        {e.need ? (
                          <Badge className="bg-emerald-100 text-emerald-800" variant="outline">Need</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800" variant="outline">Want</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={e.note}>{e.note}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => deleteExpense(e.id)}>
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500">No expenses yet. Add some above or import a CSV.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function KPI({ title, value, sub, icon }: KPIProps): JSX.Element {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
        {sub && <CardDescription>{sub}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function AddExpenseForm({ categories, onAdd }: AddExpenseFormProps): JSX.Element {
  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    category: categories[0] || "Other",
    merchant: "",
    note: "",
    need: true,
  });

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!form.amount) return;
    onAdd({ ...form, amount: Number(form.amount) });
    setForm((f) => ({ ...f, amount: "", merchant: "", note: "" }));
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <Label>Amount</Label>
          <Input type="number" min={0} placeholder="₹0" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})}/>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Merchant</Label>
          <Input placeholder="Where did you spend?" value={form.merchant} onChange={(e) => setForm({...form, merchant: e.target.value})}/>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Note</Label>
        <Textarea rows={2} placeholder="Add a short note (optional)" value={form.note} onChange={(e) => setForm({...form, note: e.target.value})}/>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="need" checked={form.need} onCheckedChange={(v) => setForm({...form, need: v})} />
          <Label htmlFor="need">Mark as <span className="font-medium">{form.need ? 'Need' : 'Want'}</span></Label>
        </div>
        <Button type="submit" className="rounded-2xl"><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>
      </div>
    </form>
  );
}
