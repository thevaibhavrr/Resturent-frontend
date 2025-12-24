import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Search, Trash2, Edit, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser } from '../utils/auth';
import { makeApi } from '../api/makeapi';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

type Expense = {
  _id: string;
  expenseReason: string;
  amount: number;
  expenseBy: string;
  expenseDate: string;
  description: string;
  category: string;
  paymentMethod: string;
  shopName?: string;
  restaurantId: string;
  staff?: {
    _id: string;
    name: string;
    position: string;
  };
    billImageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function ExpensesListPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams] = useSearchParams();
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [expenseImageUploading, setExpenseImageUploading] = useState(false);
  const user = getCurrentUser();
  const restaurantId = user?.restaurantId;

  // Filter states from URL parameters
  const [filters, setFilters] = useState({
    dateFilterType: searchParams.get('dateFilterType') || 'all',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    category: searchParams.get('category') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || ''
  });

  // Date filter utility functions
  const getDateRange = (filterType: string) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    switch (filterType) {
      case 'today':
        return {
          startDate: startOfDay.toISOString().split('T')[0],
          endDate: endOfDay.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        return {
          startDate: startOfYesterday.toISOString().split('T')[0],
          endDate: endOfYesterday.toISOString().split('T')[0]
        };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0]
        };
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };
      case 'thisYear':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        return {
          startDate: startOfYear.toISOString().split('T')[0],
          endDate: endOfYear.toISOString().split('T')[0]
        };
      default:
        return { startDate: '', endDate: '' };
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchExpenses();
    }
  }, [restaurantId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await makeApi(`/api/expenses?restaurantId=${restaurantId}`, 'GET');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const [expenseForm, setExpenseForm] = useState({
    expenseReason: '',
    amount: '',
    category: '',
    description: '',
    expenseBy: '',
    paymentMethod: '',
    shopName: '',
    expenseDate: new Date().toISOString().slice(0, 16),
    billImage: null as File | null,
    billImageUrl: ''
  });

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

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        restaurantId,
        expenseDate: new Date(expenseForm.expenseDate).toISOString(),
        billImage: undefined,
        billImageUrl: expenseForm.billImageUrl || undefined
      };

      await makeApi('/api/expenses', 'POST', expenseData);
      toast.success('Expense added successfully');
      setAddExpenseDialogOpen(false);
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
      fetchExpenses();
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to save expense');
    }
  };

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      await makeApi(`/api/expenses/${expenseToDelete}`, 'DELETE');

      setExpenses(expenses.filter(expense => expense._id !== expenseToDelete));
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    } finally {
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    // Search filter
    if (searchTerm) {
      const matchesSearch = expense.expenseReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.expenseBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (expense.shopName && expense.shopName.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
    }

    const expenseDate = new Date(expense.expenseDate);

    // Date filter based on type
    if (filters.dateFilterType !== 'all' && filters.dateFilterType !== 'customRange' && filters.dateFilterType !== 'customDate') {
      const dateRange = getDateRange(filters.dateFilterType);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        if (expenseDate < startDate || expenseDate > endDate) return false;
      }
    } else if ((filters.dateFilterType === 'customRange' || filters.dateFilterType === 'customDate') && (filters.startDate || filters.endDate)) {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (startDate && expenseDate < startDate) return false;
      if (endDate && expenseDate > endDate) return false;
    }

    // Category filter
    if (filters.category && expense.category !== filters.category) return false;

    // Payment method filter
    if (filters.paymentMethod && expense.paymentMethod !== filters.paymentMethod) return false;

    // Amount range filter
    const amount = expense.amount;
    const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : null;

    if (minAmount !== null && amount < minAmount) return false;
    if (maxAmount !== null && amount > maxAmount) return false;

    return true;
  });

  // Pagination calculations
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = filteredExpenses.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 " style={{marginTop: '100px'}}>
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Expense Management</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">Manage and track your restaurant expenses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search expenses..."
              className="pl-10 pr-4 w-full h-10 sm:h-11 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </Button>
            {Object.values(filters).some(value => value !== '' && value !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({
                    dateFilterType: 'all',
                    startDate: '',
                    endDate: '',
                    category: '',
                    paymentMethod: '',
                    minAmount: '',
                    maxAmount: ''
                  });
                  // Update URL
                  window.history.replaceState({}, '', '/admin/expenses/list');
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center justify-center px-4 py-2 sm:px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors min-h-[40px] sm:min-h-[44px]"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Add Expense</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold ">Add New Expense</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Fill in the expense details below to record a new transaction.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expense Reason *</label>
                    <input
                      type="text"
                      value={expenseForm.expenseReason}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseReason: e.target.value })}
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
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
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
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      required
                    >
                      <option value="">Select Category</option>
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
                      value={expenseForm.shopName}
                      onChange={(e) => setExpenseForm({ ...expenseForm, shopName: e.target.value })}
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
                      value={expenseForm.expenseBy}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseBy: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Staff member name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
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
                            setExpenseForm({ ...expenseForm, billImage: file });
                            handleExpenseImageUpload(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        disabled={expenseImageUploading}
                      />
                      {expenseImageUploading && (
                        <div className="text-sm text-blue-600">Uploading image...</div>
                      )}
                      {expenseForm.billImageUrl && (
                        <div className="mt-2">
                          <img
                            src={expenseForm.billImageUrl}
                            alt="Bill preview"
                            className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    rows={3}
                    placeholder="Additional details about the expense..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 gap-4">
                  <Button type="button" variant="outline" onClick={() => setAddExpenseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" style={{background:"black"}} className="bg-red-600 hover:bg-red-700 text-white">
                    Save Expense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="mb-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Filter Expenses</h3>

          {/* Date Filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Date Filters</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.dateFilterType === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'today', startDate: '', endDate: '' })}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant={filters.dateFilterType === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'yesterday', startDate: '', endDate: '' })}
                className="text-xs"
              >
                Yesterday
              </Button>
              <Button
                variant={filters.dateFilterType === 'thisWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'thisWeek', startDate: '', endDate: '' })}
                className="text-xs"
              >
                This Week
              </Button>
              <Button
                variant={filters.dateFilterType === 'thisMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'thisMonth', startDate: '', endDate: '' })}
                className="text-xs"
              >
                This Month
              </Button>
              <Button
                variant={filters.dateFilterType === 'thisYear' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'thisYear', startDate: '', endDate: '' })}
                className="text-xs"
              >
                This Year
              </Button>
              <Button
                variant={filters.dateFilterType === 'customRange' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'customRange' })}
                className="text-xs"
              >
                Date Range
              </Button>
              <Button
                variant={filters.dateFilterType === 'customDate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'customDate', endDate: '' })}
                className="text-xs"
              >
                Custom Date
              </Button>
              <Button
                variant={filters.dateFilterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, dateFilterType: 'all', startDate: '', endDate: '' })}
                className="text-xs"
              >
                All Time
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          {(filters.dateFilterType === 'customRange' || filters.dateFilterType === 'customDate') && (
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {filters.dateFilterType === 'customDate' ? 'Select Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
                {filters.dateFilterType === 'customRange' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category and Payment Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div></div>
          </div>

          {/* Amount Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Amount (₹)</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Amount (₹)</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                placeholder="10000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.dateFilterType !== 'all' || filters.category || filters.paymentMethod || filters.minAmount || filters.maxAmount) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-blue-800">Active Filters:</span>
              {filters.dateFilterType !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {filters.dateFilterType === 'today' ? 'Today' :
                   filters.dateFilterType === 'yesterday' ? 'Yesterday' :
                   filters.dateFilterType === 'thisWeek' ? 'This Week' :
                   filters.dateFilterType === 'thisMonth' ? 'This Month' :
                   filters.dateFilterType === 'thisYear' ? 'This Year' :
                   filters.dateFilterType === 'customRange' ? 'Date Range' :
                   filters.dateFilterType === 'customDate' ? 'Custom Date' : 'All Time'}
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Category: {filters.category}
                </span>
              )}
              {filters.paymentMethod && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Payment: {filters.paymentMethod}
                </span>
              )}
              {filters.minAmount && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Min: ₹{filters.minAmount}
                </span>
              )}
              {filters.maxAmount && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Max: ₹{filters.maxAmount}
                </span>
              )}
            </div>
            <Link
              to="/admin/expenses/list"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block md:hidden">
        <div className="space-y-3">
          {currentItems.length > 0 ? (
            currentItems.map((expense) => (
              <div key={expense._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{expense.expenseReason}</h3>
                      <p className="text-xs text-gray-500 mt-1">By {expense.expenseBy}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0 flex items-center space-x-2">
                      {expense.billImageUrl && (
                        <img
                          src={expense.billImageUrl}
                          alt="Bill"
                          className="w-8 h-8 object-cover rounded border border-gray-300"
                          onClick={() => window.open(expense.billImageUrl, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        expense.paymentMethod === 'Cash'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {expense.paymentMethod || 'Cash'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                    </div>
                    {expense.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{expense.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-base font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Link
                        to={`/admin/expenses/edit/${expense._id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                      <button
                        className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDeleteClick(expense._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-sm text-gray-500">
                {searchTerm || (filters.dateFilterType !== 'all' || filters.category || filters.paymentMethod || filters.minAmount || filters.maxAmount)
                  ? 'No matching expenses found'
                  : 'No expenses recorded yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-medium text-sm text-gray-900">{expense.expenseReason}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.expenseBy}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.billImageUrl ? (
                          <img
                            src={expense.billImageUrl}
                            alt="Bill"
                            className="w-10 h-10 object-cover rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(expense.billImageUrl, '_blank')}
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          expense.paymentMethod === 'Cash'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {expense.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-sm text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/expenses/edit/${expense._id}`}
                            className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                          <button
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteClick(expense._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center">
                        <Search className="h-12 w-12 text-gray-400 mb-2" />
                        {searchTerm || (filters.dateFilterType !== 'all' || filters.category || filters.paymentMethod || filters.minAmount || filters.maxAmount)
                          ? 'No matching expenses found'
                          : 'No expenses recorded yet'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          </div>

          <div className="flex items-center gap-2">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this expense record? This will permanently remove the data from your system.
              </p>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-3">
                <button
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  style={{background:"red"}}
                  onClick={handleDeleteExpense}
                >
                  Delete Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
