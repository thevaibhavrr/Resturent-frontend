import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Search, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

type Expense = {
  _id: string;
  title: string;
  description: string;
  amount: number;
  staff?: {
    _id: string;
    name: string;
    position: string;
  };
  date: string;
  createdAt: string;
};

export default function ExpensesListPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const user = getCurrentUser();
  const restaurantId = user?.restaurantId;

  useEffect(() => {
    if (restaurantId) {
      fetchExpenses();
    }
  }, [restaurantId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiRequest({
        method: 'get',
        url: `/api/expenses?restaurantId=${restaurantId}`,
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      await apiRequest({
        method: 'delete',
        url: `/api/expenses/${expenseToDelete}`,
      });
      
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

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Expense Management</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search expenses..."
              className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link 
            to="/expenses/add"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Staff</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 font-medium text-sm text-gray-900">{expense.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                      {expense.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {expense.staff ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{expense.staff.name}</span>
                          <span className="text-xs text-gray-500">{expense.staff.position}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-sm text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Link 
                          to={`/expenses/edit/${expense._id}`}
                          className="h-8 w-8 p-0 inline-flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                        <button
                          className="h-8 w-8 p-0 inline-flex items-center justify-center text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
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
                  <td colSpan={6} className="h-24 text-center text-sm text-gray-500">
                    {searchTerm ? 'No matching expenses found' : 'No expenses recorded yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h3>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone. This will permanently delete the expense record.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleDeleteExpense}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions (assuming these exist in your project)
function getCurrentUser() {
  // Implementation depends on your auth system
  return { restaurantId: 'restaurant-id' };
}

function apiRequest(options: { method: string; url: string; data?: any }) {
  // Implementation depends on your HTTP client
  return Promise.resolve({ data: [] });
}