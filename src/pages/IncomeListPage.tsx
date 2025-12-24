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

type Income = {
  _id: string;
  incomeSource: string;
  amount: number;
  incomeType: 'cash' | 'online';
  incomeDate: string;
  description: string;
  category: string;
  paymentReference?: string;
  recordedBy: string;
  restaurantId: string;
  billImageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function IncomeListPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams] = useSearchParams();
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);
  const [incomeImageUploading, setIncomeImageUploading] = useState(false);
  const user = getCurrentUser();
  const restaurantId = user?.restaurantId;

  // Filter states from URL parameters
  const [filters, setFilters] = useState({
    dateFilterType: searchParams.get('dateFilterType') || 'all',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    category: searchParams.get('category') || '',
    paymentType: searchParams.get('paymentType') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || ''
  });

  useEffect(() => {
    if (restaurantId) {
      fetchIncomes();
    }
  }, [restaurantId]);

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

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await makeApi(`/api/extra-income?restaurantId=${restaurantId}`, 'GET');
      setIncomes(response.data);
    } catch (error) {
      console.error('Error fetching incomes:', error);
      toast.error('Failed to load incomes');
    } finally {
      setLoading(false);
    }
  };

  const [incomeForm, setIncomeForm] = useState({
    incomeSource: '',
    amount: '',
    incomeType: 'cash' as 'cash' | 'online',
    incomeDate: new Date().toISOString().slice(0, 16),
    description: '',
    category: '',
    paymentReference: '',
    recordedBy: '',
    billImage: null as File | null,
    billImageUrl: ''
  });

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

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const incomeData = {
        ...incomeForm,
        amount: parseFloat(incomeForm.amount),
        restaurantId,
        incomeDate: new Date(incomeForm.incomeDate).toISOString(),
        billImage: undefined,
        billImageUrl: incomeForm.billImageUrl || undefined
      };

      await makeApi('/api/extra-income', 'POST', incomeData);
      toast.success('Income added successfully');
      setAddIncomeDialogOpen(false);
      setIncomeForm({
        incomeSource: '',
        amount: '',
        incomeType: 'cash',
        incomeDate: new Date().toISOString().slice(0, 16),
        description: '',
        category: '',
        paymentReference: '',
        recordedBy: '',
        billImage: null,
        billImageUrl: ''
      });
      fetchIncomes();
    } catch (error) {
      console.error('Error submitting income:', error);
      toast.error('Failed to save income');
    }
  };

  const handleDeleteClick = (incomeId: string) => {
    setIncomeToDelete(incomeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteIncome = async () => {
    if (!incomeToDelete) return;

    try {
      await makeApi(`/api/extra-income/${incomeToDelete}`, 'DELETE');

      setIncomes(incomes.filter(income => income._id !== incomeToDelete));
      toast.success('Income deleted successfully');
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('Failed to delete income');
    } finally {
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    }
  };

  const filteredIncomes = incomes.filter(income => {
    // Search filter
    if (searchTerm) {
      const matchesSearch = income.incomeSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           income.recordedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (income.description && income.description.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
    }

    const incomeDate = new Date(income.incomeDate);

    // Date filter based on type
    if (filters.dateFilterType !== 'all' && filters.dateFilterType !== 'customRange' && filters.dateFilterType !== 'customDate') {
      const dateRange = getDateRange(filters.dateFilterType);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        if (incomeDate < startDate || incomeDate > endDate) return false;
      }
    } else if ((filters.dateFilterType === 'customRange' || filters.dateFilterType === 'customDate') && (filters.startDate || filters.endDate)) {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (startDate && incomeDate < startDate) return false;
      if (endDate && incomeDate > endDate) return false;
    }

    // Category filter
    if (filters.category && income.category !== filters.category) return false;

    // Payment type filter
    if (filters.paymentType && income.incomeType !== filters.paymentType) return false;

    // Amount range filter
    const amount = income.amount;
    const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : null;

    if (minAmount !== null && amount < minAmount) return false;
    if (maxAmount !== null && amount > maxAmount) return false;

    return true;
  });

  // Pagination calculations
  const totalItems = filteredIncomes.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = filteredIncomes.slice(startIndex, endIndex);

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Income Management</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">Manage and track your restaurant extra income</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search incomes..."
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
                    paymentType: '',
                    minAmount: '',
                    maxAmount: ''
                  });
                  // Update URL
                  window.history.replaceState({}, '', '/admin/income/list');
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          <Dialog open={addIncomeDialogOpen} onOpenChange={setAddIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center justify-center px-4 py-2 sm:px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors min-h-[40px] sm:min-h-[44px]"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Add Income</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold ">Add New Income</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Fill in income details below to record a new transaction.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleIncomeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Income Source *</label>
                    <input
                      type="text"
                      value={incomeForm.incomeSource}
                      onChange={(e) => setIncomeForm({ ...incomeForm, incomeSource: e.target.value })}
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
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
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
                      value={incomeForm.incomeType}
                      onChange={(e) => setIncomeForm({ ...incomeForm, incomeType: e.target.value as 'cash' | 'online' })}
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
                      value={incomeForm.category}
                      onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Events">Events</option>
                      <option value="Catering">Catering</option>
                      <option value="Advertising">Advertising</option>
                      <option value="Partnerships">Partnerships</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Recorded By *</label>
                    <input
                      type="text"
                      value={incomeForm.recordedBy}
                      onChange={(e) => setIncomeForm({ ...incomeForm, recordedBy: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Staff member name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Reference</label>
                    <input
                      type="text"
                      value={incomeForm.paymentReference}
                      onChange={(e) => setIncomeForm({ ...incomeForm, paymentReference: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Transaction ID, Invoice #, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Income Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={incomeForm.incomeDate}
                      onChange={(e) => setIncomeForm({ ...incomeForm, incomeDate: e.target.value })}
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
                            setIncomeForm({ ...incomeForm, billImage: file });
                            handleIncomeImageUpload(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        disabled={incomeImageUploading}
                      />
                      {incomeImageUploading && (
                        <div className="text-sm text-blue-600">Uploading image...</div>
                      )}
                      {incomeForm.billImageUrl && (
                        <div className="mt-2">
                          <img
                            src={incomeForm.billImageUrl}
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
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    rows={3}
                    placeholder="Additional details about income..."
                  />
                </div>

                <div className="flex justify-end gap-3 space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setAddIncomeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" style={{background:"black"}} >
                    Save Income
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
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Filter Income</h3>

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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                {filters.dateFilterType === 'customRange' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="">All Categories</option>
                <option value="Events">Events</option>
                <option value="Catering">Catering</option>
                <option value="Advertising">Advertising</option>
                <option value="Partnerships">Partnerships</option>
                <option value="Delivery">Delivery</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
              <select
                value={filters.paymentType}
                onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="">All Types</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Amount (₹)</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                placeholder="10000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.dateFilterType !== 'all' || filters.category || filters.paymentType || filters.minAmount || filters.maxAmount) && (
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
              {filters.paymentType && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Type: {filters.paymentType}
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
              to="/admin/income/list"
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
            currentItems.map((income) => (
              <div key={income._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{income.incomeSource}</h3>
                      <p className="text-xs text-gray-500 mt-1">By {income.recordedBy}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0 flex items-center space-x-2">
                      {income.billImageUrl && (
                        <img
                          src={income.billImageUrl}
                          alt="Bill"
                          className="w-8 h-8 object-cover rounded border border-gray-300"
                          onClick={() => window.open(income.billImageUrl, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        income.incomeType === 'cash'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {income.incomeType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      {format(new Date(income.incomeDate), 'MMM dd, yyyy')}
                    </div>
                    {income.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{income.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-base font-semibold text-gray-900">
                      {formatCurrency(income.amount)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Link
                        to={`/admin/income/edit/${income._id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                      <button
                        className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDeleteClick(income._id)}
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
                {searchTerm || (filters.dateFilterType !== 'all' || filters.category || filters.paymentType || filters.minAmount || filters.maxAmount)
                  ? 'No matching incomes found'
                  : 'No incomes recorded yet'}
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((income) => (
                    <tr key={income._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(income.incomeDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-medium text-sm text-gray-900">{income.incomeSource}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{income.recordedBy}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {income.billImageUrl ? (
                          <img
                            src={income.billImageUrl}
                            alt="Bill"
                            className="w-10 h-10 object-cover rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(income.billImageUrl, '_blank')}
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          income.incomeType === 'cash'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {income.incomeType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{income.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {income.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-sm text-gray-900">
                        {formatCurrency(income.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/income/edit/${income._id}`}
                            className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                          <button
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteClick(income._id)}
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
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center">
                        <Search className="h-12 w-12 text-gray-400 mb-2" />
                        {searchTerm || (filters.dateFilterType !== 'all' || filters.category || filters.paymentType || filters.minAmount || filters.maxAmount)
                          ? 'No matching incomes found'
                          : 'No incomes recorded yet'}
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Income</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this income record? This will permanently remove the data from your system.
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
                  onClick={handleDeleteIncome}
                  style={{background:"red"}}
                >
                  Delete Income
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
