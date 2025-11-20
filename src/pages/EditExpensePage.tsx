import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type StaffMember = {
  _id: string;
  name: string;
  position: string;
};

type ExpenseData = {
  _id: string;
  title: string;
  description: string;
  amount: number;
  staff?: StaffMember;
  date: string;
};

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<Omit<ExpenseData, '_id'>>({ 
    title: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const restaurantId = user?.restaurantId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch expense details
        const [expenseRes, staffRes] = await Promise.all([
          apiRequest({ method: 'get', url: `/api/expenses/${id}` }),
          apiRequest({ method: 'get', url: `/api/staff?restaurantId=${restaurantId}` })
        ]);

        const expenseData = expenseRes.data;
        setFormData({
          title: expenseData.title,
          description: expenseData.description || '',
          amount: expenseData.amount,
          staff: expenseData.staff?._id || '',
          date: expenseData.date.split('T')[0]
        });
        
        setStaffMembers(staffRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load expense data');
        navigate('/expenses');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId && id) {
      fetchData();
    }
  }, [id, restaurantId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      staff: e.target.value || undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount) {
      toast.error('Title and amount are required');
      return;
    }

    try {
      setSaving(true);
      await apiRequest({
        method: 'put',
        url: `/api/expenses/${id}`,
        data: {
          ...formData,
          amount: parseFloat(formData.amount as unknown as string),
          restaurantId
        }
      });
      
      toast.success('Expense updated successfully');
      navigate('/expenses');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error(error.response?.data?.message || 'Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Expense</h1>
        <button 
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={() => navigate('/expenses')}
        >
          Back to Expenses
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Office Supplies, Food & Beverage"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount (₹) *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="staff" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Staff Member (Optional)
              </label>
              <select 
                id="staff"
                value={formData.staff as string}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">None</option>
                {staffMembers.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} ({staff.position})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add any additional details about this expense..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              onClick={() => navigate('/expenses')}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}