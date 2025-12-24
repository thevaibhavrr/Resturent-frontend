import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeApi } from '../../api/makeapi';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  CreditCard,
  Wallet,
  Receipt,
  Edit,
  Trash2,
  Eye,
  Tag,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { getCurrentUser } from '../../utils/auth';
import { formatCurrency } from '../../utils/formatters';
import { getNetProfitStats } from '../../api/billApi';
import ExpenseForm from './ExpenseForm';

interface Expense {
  _id: string;
  expenseReason: string;
  amount: number;
  expenseBy: string;
  expenseDate: string;
  category: string;
  description?: string;
  paymentMethod: string;
  shopName?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExtraIncome {
  _id: string;
  incomeSource: string;
  amount: number;
  incomeType: 'cash' | 'online';
  incomeDate: string;
  category: string;
  recordedBy: string;
  description?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IncomeExpensesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [extraIncomes, setExtraIncomes] = useState<ExtraIncome[]>([]);
  const [tableOrderProfits, setTableOrderProfits] = useState({
    totalNetProfit: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<ExtraIncome | null>(null);

  // Image upload states
  const [expenseImageUploading, setExpenseImageUploading] = useState(false);
  const [incomeImageUploading, setIncomeImageUploading] = useState(false);

  // Filter states
  const [showExpenseFilters, setShowExpenseFilters] = useState(false);

  // Date filter utility functions
  const getDateRange = (filterType: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    switch (filterType) {
      case 'today':
        return {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        return {
          startDate: startOfYesterday.toISOString(),
          endDate: endOfYesterday.toISOString()
        };
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString()
        };
      }
      case 'thisMonth': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString()
        };
      }
      case 'thisYear': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        return {
          startDate: startOfYear.toISOString(),
          endDate: endOfYear.toISOString()
        };
      }
      default:
        return { startDate: '', endDate: '' };
    }
  };

  const todayRange = getDateRange('today');

  const [expenseFilters, setExpenseFilters] = useState({
    dateFilterType: 'today' as 'all' | 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'customRange' | 'customDate',
    startDate: todayRange.startDate || '',
    endDate: todayRange.endDate || '',
    category: '',
    paymentType: '',
    paymentMethod: '',
    minAmount: '',
    maxAmount: ''
  });


  const handleDateFilterChange = (filterType: string, isExpense: boolean) => {
    const dateRange = getDateRange(filterType);
    setExpenseFilters({
      ...expenseFilters,
      dateFilterType: filterType as any,
      startDate: dateRange.startDate || '',
      endDate: dateRange.endDate || ''
    });
  };

  const clearExpenseFilters = () => {
    setExpenseFilters({
      dateFilterType: 'all',
      startDate: '',
      endDate: '',
      category: '',
      paymentType: '',
      paymentMethod: '',
      minAmount: '',
      maxAmount: ''
    });
  };


  const [expenseForm, setExpenseForm] = useState({
    expenseReason: '',
    amount: '',
    category: '',
    description: '',
    expenseBy: '',
    paymentMethod: '',
    shopName: '',
    expenseDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format for datetime-local
    billImage: null as File | null,
    billImageUrl: ''
  });

  const [incomeForm, setIncomeForm] = useState({
    incomeSource: '',
    amount: '',
    incomeType: 'cash' as 'cash' | 'online',
    category: '',
    description: '',
    recordedBy: '',
    paymentReference: '',
    incomeDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format for datetime-local
    billImage: null as File | null,
    billImageUrl: ''
  });

  const user = getCurrentUser();
  const restaurantId = user?.restaurantId;

  const fetchTableOrderProfits = async () => {
    if (!restaurantId) {
      console.log('No restaurantId available, skipping table profits fetch');
      return;
    }

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (expenseFilters.dateFilterType !== 'all') {
        if (expenseFilters.dateFilterType === 'customDate' && expenseFilters.startDate) {
          // For custom date, filter for the specific date only
          const customDate = new Date(expenseFilters.startDate);
          customDate.setHours(0, 0, 0, 0);
          startDate = customDate.toISOString();

          const endOfCustomDate = new Date(expenseFilters.startDate);
          endOfCustomDate.setHours(23, 59, 59, 999);
          endDate = endOfCustomDate.toISOString();
        } else if (expenseFilters.dateFilterType === 'customRange') {
          // For custom range, use both start and end dates
          if (expenseFilters.startDate) {
            const start = new Date(expenseFilters.startDate);
            start.setHours(0, 0, 0, 0);
            startDate = start.toISOString();
          }
          if (expenseFilters.endDate) {
            const end = new Date(expenseFilters.endDate);
            end.setHours(23, 59, 59, 999);
            endDate = end.toISOString();
          }
        } else {
          // For predefined filters (today, yesterday, thisWeek, etc.)
          const dateRange = getDateRange(expenseFilters.dateFilterType);
          if (dateRange.startDate && dateRange.endDate) {
            startDate = dateRange.startDate; // Full ISO string
            endDate = dateRange.endDate; // Full ISO string
          }
        }
      }

      console.log('Fetching table profits with date range:', { startDate, endDate, dateFilterType: expenseFilters.dateFilterType });

      const profits = await getNetProfitStats({ startDate, endDate });
      console.log('Raw API response:', profits);
      console.log('Table profits API response:', profits);

      setTableOrderProfits({
        totalNetProfit: profits.totalNetProfit || 0,
        totalOrders: profits.totalOrders || 0
      });
    } catch (error) {
      console.error('Error loading table order profits:', error);
      setTableOrderProfits({ totalNetProfit: 0, totalOrders: 0 });
    }
  };

  const loadData = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      await Promise.all([loadExpenses(), loadExtraIncomes(), fetchTableOrderProfits()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, expenseFilters]);

  const loadExpenses = useCallback(async () => {
    try {
      const response = await makeApi(`/api/expenses?restaurantId=${restaurantId}`);

      let expenses: Expense[] = response.data || [];
      setExpenses(expenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    }
  }, [restaurantId]);

  const loadExtraIncomes = useCallback(async () => {
    try {
      const response = await makeApi(`/api/extra-income?restaurantId=${restaurantId}`);

      let extraIncomes: ExtraIncome[] = response.data || [];
      setExtraIncomes(extraIncomes);
    } catch (error) {
      console.error('Error loading extra incomes:', error);
      setExtraIncomes([]);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter functions
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      expenseDate.setHours(0, 0, 0, 0); // Normalize time part for comparison

      // Date filter based on type
      if (expenseFilters.dateFilterType !== 'all') {
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (expenseFilters.dateFilterType !== 'customRange' && expenseFilters.dateFilterType !== 'customDate') {
          const dateRange = getDateRange(expenseFilters.dateFilterType);
          startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
          endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        } else if (expenseFilters.dateFilterType === 'customDate' && expenseFilters.startDate) {
          // For custom date, filter for the specific date only
          startDate = new Date(expenseFilters.startDate);
          endDate = new Date(expenseFilters.startDate);
        } else if (expenseFilters.dateFilterType === 'customRange') {
          // For custom range, use both start and end dates
          if (expenseFilters.startDate) {
            startDate = new Date(expenseFilters.startDate);
          }
          if (expenseFilters.endDate) {
            endDate = new Date(expenseFilters.endDate);
          }
        }

        // Normalize dates for comparison
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          if (expenseDate < startDate) return false;
        }
        
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
          if (expenseDate > endDate) return false;
        }
      }

      // Category filter
      if (expenseFilters.category && expense.category !== expenseFilters.category) return false;


      // Payment method filter
      if (expenseFilters.paymentMethod && expense.paymentMethod !== expenseFilters.paymentMethod) return false;

      // Amount range filter
      const amount = expense.amount;
      const minAmount = expenseFilters.minAmount ? parseFloat(expenseFilters.minAmount) : null;
      const maxAmount = expenseFilters.maxAmount ? parseFloat(expenseFilters.maxAmount) : null;

      if (minAmount !== null && amount < minAmount) return false;
      if (maxAmount !== null && amount > maxAmount) return false;

      return true;
    });
  }, [expenses, expenseFilters]);

  const filteredExtraIncomes = useMemo(() => {
    return extraIncomes.filter(income => {
      const incomeDate = new Date(income.incomeDate);
      incomeDate.setHours(0, 0, 0, 0); // Normalize time part for comparison

      // Date filter based on type (use expense filters for both)
      if (expenseFilters.dateFilterType !== 'all') {
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (expenseFilters.dateFilterType === 'customDate' && expenseFilters.startDate) {
          // For custom date, filter for the specific date only
          startDate = new Date(expenseFilters.startDate);
          endDate = new Date(expenseFilters.startDate);
        } else if (expenseFilters.dateFilterType === 'customRange') {
          // For custom range, use both start and end dates
          if (expenseFilters.startDate) {
            startDate = new Date(expenseFilters.startDate);
          }
          if (expenseFilters.endDate) {
            endDate = new Date(expenseFilters.endDate);
          }
        } else {
          // For predefined filters (today, yesterday, thisWeek, etc.)
          const dateRange = getDateRange(expenseFilters.dateFilterType);
          startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
          endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        }

        // Normalize dates for comparison
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          if (incomeDate < startDate) return false;
        }

        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
          if (incomeDate > endDate) return false;
        }
      }

      // Category filter
      if (expenseFilters.category && income.category !== expenseFilters.category) return false;

      // Payment type filter (map expense paymentMethod to income paymentType)
      if (expenseFilters.paymentType && income.incomeType !== expenseFilters.paymentType) return false;

      // Amount range filter
      const amount = income.amount;
      const minAmount = expenseFilters.minAmount ? parseFloat(expenseFilters.minAmount) : null;
      const maxAmount = expenseFilters.maxAmount ? parseFloat(expenseFilters.maxAmount) : null;

      if (minAmount !== null && amount < minAmount) return false;
      if (maxAmount !== null && amount > maxAmount) return false;

      return true;
    });
  }, [extraIncomes, expenseFilters]);


  const resetExpenseForm = () => {
    setExpenseForm({
      expenseReason: '',
      amount: '',
      category: '',
      description: '',
      expenseBy: '',
      paymentMethod: '',
      shopName: '',
      expenseDate: new Date().toISOString().slice(0, 16),
      billImage: null,
      billImageUrl: ''
    });
  };

  const resetIncomeForm = () => {
    setIncomeForm({
      incomeSource: '',
      amount: '',
      incomeType: 'cash',
      category: '',
      description: '',
      recordedBy: '',
      paymentReference: '',
      incomeDate: new Date().toISOString().slice(0, 16),
      billImage: null,
      billImageUrl: ''
    });
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        restaurantId,
        expenseDate: new Date(expenseForm.expenseDate).toISOString(),
        billImage: undefined, // Remove file object before sending
        billImageUrl: expenseForm.billImageUrl || undefined
      };

      const endpoint = editingExpense
        ? `/api/expenses/${editingExpense._id}`
        : '/api/expenses';

      const method = editingExpense ? 'PUT' : 'POST';

      await makeApi(endpoint, method, expenseData);

        toast.success(editingExpense ? 'Expense updated successfully' : 'Expense added successfully');
        setShowExpenseDialog(false);
        setEditingExpense(null);
        resetExpenseForm();
        loadExpenses();
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to save expense');
    }
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const incomeData = {
        ...incomeForm,
        amount: parseFloat(incomeForm.amount),
        restaurantId,
        incomeDate: new Date(incomeForm.incomeDate).toISOString(),
        billImage: undefined, // Remove file object before sending
        billImageUrl: incomeForm.billImageUrl || undefined
      };

      const endpoint = editingIncome
        ? `/api/extra-income/${editingIncome._id}`
        : '/api/extra-income';

      const method = editingIncome ? 'PUT' : 'POST';

      await makeApi(endpoint, method, incomeData);

        toast.success(editingIncome ? 'Extra income updated successfully' : 'Extra income added successfully');
        setShowIncomeDialog(false);
        setEditingIncome(null);
        resetIncomeForm();
        loadExtraIncomes();
    } catch (error) {
      console.error('Error submitting income:', error);
      toast.error('Failed to save extra income');
    }
  };

  const editExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      expenseReason: expense.expenseReason,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      expenseBy: expense.expenseBy,
      paymentMethod: expense.paymentMethod,
      shopName: expense.shopName || ''
    });
    setShowExpenseDialog(true);
  };

  const editIncome = (income: ExtraIncome) => {
    setEditingIncome(income);
    setIncomeForm({
      incomeSource: income.incomeSource,
      amount: income.amount.toString(),
      incomeType: income.incomeType,
      category: income.category,
      description: income.description || '',
      recordedBy: income.recordedBy,
      paymentReference: income.paymentReference || ''
    });
    setShowIncomeDialog(true);
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await makeApi(`/api/expenses/${id}`, 'DELETE');

        toast.success('Expense deleted successfully');
        loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
          toast.error('Failed to delete expense');
        }
  };

  // Image upload handlers
  const handleExpenseImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setExpenseImageUploading(true);
      const result = await uploadToCloudinary(file);
      setExpenseForm(prev => ({
        ...prev,
        billImageUrl: result.secure_url
      }));
      toast.success('Bill image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setExpenseImageUploading(false);
    }
  };

  const handleIncomeImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setIncomeImageUploading(true);
      const result = await uploadToCloudinary(file);
      setIncomeForm(prev => ({
        ...prev,
        billImageUrl: result.secure_url
      }));
      toast.success('Bill image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIncomeImageUploading(false);
    }
  };

  const deleteIncome = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extra income entry?')) return;

    try {
      await makeApi(`/api/extra-income/${id}`, 'DELETE');

        toast.success('Extra income entry deleted successfully');
        loadExtraIncomes();
    } catch (error) {
      console.error('Error deleting extra income:', error);
      toast.error('Failed to delete extra income entry');
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalExtraIncome = filteredExtraIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalTableOrderProfits = tableOrderProfits.totalNetProfit;
  const netIncome = (totalExtraIncome + totalTableOrderProfits) - totalExpenses;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" style={{ marginTop: '100px' }}>


      <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-slate-200/50 shadow-xl p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogTrigger asChild>
              <Button className="h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{ border: '2px solid rgb(31 181 181 / 58%)' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-black" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-black">Add Expense</div>
                    <div className="text-xs opacity-90 text-black">Record new expense</div>
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent style={{background:"white"}} className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 bg-white/95 backdrop-blur-lg borde shadow-2xl"

            >
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Add New Expense</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Fill in the expense details below to record a new transaction.
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm
                form={expenseForm}
                setForm={setExpenseForm}
                onSubmit={handleExpenseSubmit}
                onCancel={() => {
                  setShowExpenseDialog(false);
                  setEditingExpense(null);
                  resetExpenseForm();
                }}
                onImageUpload={handleExpenseImageUpload}
                imageUploading={expenseImageUploading}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}
          
          >
            <DialogTrigger asChild>
              <Button className="h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{ border: '2px solid rgb(31 181 181 / 58%)' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-black" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-black">Add Income</div>
                    <div className="text-xs opacity-90 text-black">Record extra income</div>
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent style={{background:"white"}} className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">Add Extra Income</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Fill in the income details below to record additional revenue.
                </DialogDescription>
              </DialogHeader>
              <IncomeForm
                form={incomeForm}
                setForm={setIncomeForm}
                onSubmit={handleIncomeSubmit}
                onCancel={() => {
                  setShowIncomeDialog(false);
                  setEditingIncome(null);
                  resetIncomeForm();
                }}
                onImageUpload={handleIncomeImageUpload}
                imageUploading={incomeImageUploading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expense Filters */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-slate-200/50 shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setShowExpenseFilters(!showExpenseFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>{showExpenseFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </Button>
          {Object.values(expenseFilters).some(value => value !== '') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearExpenseFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {showExpenseFilters && (
          <div className="space-y-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Date</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant={expenseFilters.dateFilterType === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('today', true)}
                  className="text-xs"
                >
                  Today
                </Button>
                <Button
                  variant={expenseFilters.dateFilterType === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('yesterday', true)}
                  className="text-xs"
                >
                  Yesterday
                </Button>
                <Button
                  variant={expenseFilters.dateFilterType === 'thisWeek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('thisWeek', true)}
                  className="text-xs"
                >
                  This Week
                </Button>
                <Button
                  variant={expenseFilters.dateFilterType === 'thisMonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('thisMonth', true)}
                  className="text-xs"
                >
                  This Month
                </Button>
                <Button
                  variant={expenseFilters.dateFilterType === 'thisYear' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('thisYear', true)}
                  className="text-xs"
                >
                  This Year
                </Button>
                <Button
                  variant={expenseFilters.dateFilterType === 'customRange' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpenseFilters({ ...expenseFilters, dateFilterType: 'customRange' })}
                  className="text-xs"
                >
                  Date Range
                </Button>
                <Button
                  variant={expenseFilters.dateFilterType === 'customDate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpenseFilters({ ...expenseFilters, dateFilterType: 'customDate', endDate: '' })}
                  className="text-xs"
                >
                  Custom Date
                </Button>
                <Button
                  variant={expenseFilters.dateFilterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpenseFilters({ ...expenseFilters, dateFilterType: 'all', startDate: '', endDate: '' })}
                  className="text-xs"
                >
                  All Time
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            {(expenseFilters.dateFilterType === 'customRange' || expenseFilters.dateFilterType === 'customDate') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {expenseFilters.dateFilterType === 'customDate' ? 'Select Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={expenseFilters.startDate}
                    onChange={(e) => setExpenseFilters({ ...expenseFilters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
                {expenseFilters.dateFilterType === 'customRange' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={expenseFilters.endDate}
                      onChange={(e) => setExpenseFilters({ ...expenseFilters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            )}

         
          </div>
        )}

        {/* Filter Summary */}
        {Object.values(expenseFilters).some(value => value !== '' && value !== 'all') && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {expenseFilters.dateFilterType !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {expenseFilters.dateFilterType === 'today' ? 'Today' :
                      expenseFilters.dateFilterType === 'yesterday' ? 'Yesterday' :
                        expenseFilters.dateFilterType === 'thisWeek' ? 'This Week' :
                          expenseFilters.dateFilterType === 'thisMonth' ? 'This Month' :
                            expenseFilters.dateFilterType === 'thisYear' ? 'This Year' :
                              expenseFilters.dateFilterType === 'customRange' ? 'Date Range' :
                                expenseFilters.dateFilterType === 'customDate' ? 'Custom Date' : 'All Time'}
                  </Badge>
                )}
                {(expenseFilters.dateFilterType === 'customRange' || expenseFilters.dateFilterType === 'customDate') && expenseFilters.startDate && (
                  <Badge variant="secondary" className="text-xs">
                    From: {new Date(expenseFilters.startDate).toLocaleDateString()}
                  </Badge>
                )}
                {expenseFilters.dateFilterType === 'customRange' && expenseFilters.endDate && (
                  <Badge variant="secondary" className="text-xs">
                    To: {new Date(expenseFilters.endDate).toLocaleDateString()}
                  </Badge>
                )}
                {expenseFilters.category && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {expenseFilters.category}
                  </Badge>
                )}
                {expenseFilters.paymentType && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {expenseFilters.paymentType}
                  </Badge>
                )}
                {expenseFilters.paymentMethod && (
                  <Badge variant="secondary" className="text-xs">
                    Method: {expenseFilters.paymentMethod}
                  </Badge>
                )}
                {expenseFilters.minAmount && (
                  <Badge variant="secondary" className="text-xs">
                    Min: ₹{expenseFilters.minAmount}
                  </Badge>
                )}
                {expenseFilters.maxAmount && (
                  <Badge variant="secondary" className="text-xs">
                    Max: ₹{expenseFilters.maxAmount}
                  </Badge>
                )}
              </div>
              <span className="text-sm text-slate-600">
                {filteredExpenses.length} of {expenses.length} expenses
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">


        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8 lg:mb-12">
          <div
            className="group relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl p-6 sm:p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => {
              const params = new URLSearchParams();
              if (expenseFilters.dateFilterType !== 'all') params.set('dateFilterType', expenseFilters.dateFilterType);
              if (expenseFilters.startDate) params.set('startDate', expenseFilters.startDate);
              if (expenseFilters.endDate) params.set('endDate', expenseFilters.endDate);
              if (expenseFilters.category) params.set('category', expenseFilters.category);
              if (expenseFilters.paymentMethod) params.set('paymentMethod', expenseFilters.paymentMethod);
              if (expenseFilters.minAmount) params.set('minAmount', expenseFilters.minAmount);
              if (expenseFilters.maxAmount) params.set('maxAmount', expenseFilters.maxAmount);
              navigate(`/admin/expenses/list${params.toString() ? `?${params.toString()}` : ''}`);
            }}
          >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 p-3" style={{ border: '2px solid #000', borderRadius: '10px' }} >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingDown className="w-6 h-6 text-black" />
                </div>
                <div className="flex items-center space-x-1 text-black/70">
                  <span className="text-sm font-medium">View Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-black text-sm font-medium mb-2">Total Expenses</h3>
              <p className="text-3xl sm:text-4xl font-bold text-black mb-1">₹{totalExpenses.toFixed(2)}</p>
              <p className="text-black/70 text-sm">{filteredExpenses.length} transactions</p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          </div>

          <div
            className="group relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl p-6 sm:p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => {
              const params = new URLSearchParams();
              if (expenseFilters.dateFilterType !== 'all') params.set('dateFilterType', expenseFilters.dateFilterType);
              if (expenseFilters.startDate) params.set('startDate', expenseFilters.startDate);
              if (expenseFilters.endDate) params.set('endDate', expenseFilters.endDate);
              if (expenseFilters.category) params.set('category', expenseFilters.category);
              if (expenseFilters.paymentType) params.set('paymentType', expenseFilters.paymentType);
              if (expenseFilters.minAmount) params.set('minAmount', expenseFilters.minAmount);
              if (expenseFilters.maxAmount) params.set('maxAmount', expenseFilters.maxAmount);
              navigate(`/admin/income/list${params.toString() ? `?${params.toString()}` : ''}`);
            }}

          >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 p-3" style={{ border: '2px solid #000', borderRadius: '10px' }} >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div className="flex items-center space-x-1 text-black/70">
                  <span className="text-sm font-medium">View Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-black text-sm font-medium mb-2">Extra Income</h3>
              <p className="text-3xl sm:text-4xl font-bold text-black mb-1">₹{totalExtraIncome.toFixed(2)}</p>
              <p className="text-black/70 text-sm">{filteredExtraIncomes.length} transactions</p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          </div>

          <div
            className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 sm:p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => navigate('/admin/reports')}
          >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 p-3" style={{ border: '2px solid #000', borderRadius: '10px' }} >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div className="flex items-center space-x-1 text-black/70">
                  <span className="text-sm font-medium">View Report</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-black text-sm font-medium mb-2">Table Order Profits</h3>
              <p className="text-3xl sm:text-4xl font-bold text-black mb-1">₹{totalTableOrderProfits.toFixed(2)}</p>
              <p className="text-black/70 text-sm">{tableOrderProfits.totalOrders} orders</p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        </div>

          <div
            className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => navigate('/admin/reports')}
          >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 p-3" style={{ border: '2px solid #000', borderRadius: '10px' }} >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign className="w-6 h-6 text-black" />
          </div>
                <div className="flex items-center space-x-1 text-black/70">
                  <span className="text-sm font-medium">View Report</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
              </div>
            </div>
              <h3 className="text-black text-sm font-medium mb-2">Total Net Result</h3>
              <p className={`text-3xl sm:text-4xl font-bold mb-1 ${netIncome >= 0 ? 'text-black' : 'text-red-600'}`}>
                ₹{netIncome.toFixed(2)}
              </p>
              <p className="text-black/70 text-sm">
                {netIncome >= 0 ? 'Profit' : 'Loss'} (Table + Extra Income - Expenses)
              </p>
                          </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-xl" />
              </div>
            </div>

       
      </div>
    </div>
  );
}

// Expense Form Component
function ExpenseForm({ form, setForm, onSubmit, onCancel, onImageUpload, imageUploading }: {
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onImageUpload?: (file: File) => void;
  imageUploading?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expense Reason *</label>
          <input
            type="text"
            value={form.expenseReason}
            onChange={(e) => setForm({ ...form, expenseReason: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder="e.g., Vegetables, Utilities"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            required
          >
            <option value="">All Categories</option>
            <option value="Food Supplies">Vegitable</option>
            <option value="Rent">Rent</option>
            <option value="Salaries">Salaries</option>
            <option value="Equipment">Equipment</option>
            <option value="Marketing">Marketing</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Food items">Food items</option>
            <option value="Loss">Loss</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
          <input
            type="text"
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder="e.g., Big Bazaar, Local Market"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expense By *</label>
          <input
            type="text"
            value={form.expenseBy}
            onChange={(e) => setForm({ ...form, expenseBy: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder="Staff member name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            required
          >
            <option value="">Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
          rows={3}
          placeholder="Additional details about the expense..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date & Time *</label>
          <input
            type="datetime-local"
            value={form.expenseDate}
            onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bill Image</label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setForm({ ...form, billImage: file });
                  onImageUpload?.(file);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              disabled={imageUploading}
            />
            {imageUploading && (
              <div className="text-sm text-blue-600">Uploading image...</div>
            )}
            {form.billImageUrl && (
              <div className="mt-2">
                <img
                  src={form.billImageUrl}
                  alt="Bill preview"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-evenly w-100 gap-4 space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="px-6">
          Cancel
        </Button>
        <Button type="submit" style={{ background: "black" }} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6">
          Save Expense
        </Button>
      </div>
    </form>
  );
}

// Income Form Component
function IncomeForm({ form, setForm, onSubmit, onCancel, onImageUpload, imageUploading }: {
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onImageUpload?: (file: File) => void;
  imageUploading?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Income Source *</label>
          <input
            type="text"
            value={form.incomeSource}
            onChange={(e) => setForm({ ...form, incomeSource: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="e.g., Event Catering, Partnership"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Income Type *</label>
          <select
            value={form.incomeType}
            onChange={(e) => setForm({ ...form, incomeType: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            required
          >
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            required
          >
            <option value="">Select Category</option>
            <option value="belivmart">Belivmart</option>
            <option value="item sales">Item sales</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Recorded By *</label>
          <input
            type="text"
            value={form.recordedBy}
            onChange={(e) => setForm({ ...form, recordedBy: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="Staff member name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Reference</label>
          <input
            type="text"
            value={form.paymentReference}
            onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="Transaction ID, Invoice #, etc."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          rows={3}
          placeholder="Additional details about the income..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Income Date & Time *</label>
          <input
            type="datetime-local"
            value={form.incomeDate}
            onChange={(e) => setForm({ ...form, incomeDate: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bill Image</label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setForm({ ...form, billImage: file });
                  onImageUpload?.(file);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              disabled={imageUploading}
            />
            {imageUploading && (
              <div className="text-sm text-blue-600">Uploading image...</div>
            )}
            {form.billImageUrl && (
              <div className="mt-2">
                <img
                  src={form.billImageUrl}
                  alt="Bill preview"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="px-6">
          Cancel
        </Button>
        <Button type="submit" style={{background:"black"}} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6">
          Save Income
        </Button>
      </div>
    </form>
  );
}