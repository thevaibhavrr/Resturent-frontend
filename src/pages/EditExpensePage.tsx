import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser } from '../utils/auth';
import { makeApi } from '../api/makeapi';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

type ExpenseData = {
  _id: string;
  expenseReason: string;
  amount: number;
  expenseBy: string;
  expenseDate: string;
  description?: string;
  category: string;
  paymentMethod: string;
  shopName?: string;
  restaurantId: string;
  billImageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    expenseReason: '',
    amount: '',
    expenseBy: '',
    expenseDate: '',
    description: '',
    category: '',
    paymentMethod: '',
    shopName: '',
    billImageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const restaurantId = user?.restaurantId;

  useEffect(() => {
    const fetchExpense = async () => {
      if (!id || !restaurantId) return;

      try {
        setLoading(true);
        const response = await makeApi(`/api/expenses/${id}?restaurantId=${restaurantId}`, 'GET');

        if (response.data) {
          const expenseData = response.data;
        setFormData({
            expenseReason: expenseData.expenseReason,
            amount: expenseData.amount.toString(),
            expenseBy: expenseData.expenseBy,
            expenseDate: new Date(expenseData.expenseDate).toISOString().split('T')[0],
          description: expenseData.description || '',
            category: expenseData.category,
            paymentMethod: expenseData.paymentMethod,
            shopName: expenseData.shopName || '',
            billImageUrl: expenseData.billImageUrl || ''
        });
        } else {
          toast.error('Failed to load expense details');
        }
      } catch (error) {
        console.error('Error fetching expense:', error);
        toast.error('Failed to load expense details');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id, restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !restaurantId) return;

    try {
      setSaving(true);

      const updateData = {
          ...formData,
        amount: parseFloat(formData.amount),
          restaurantId,
          billImageUrl: formData.billImageUrl || undefined
      };

      const response = await makeApi(`/api/expenses/${id}`, 'PUT', updateData);
      
      if (response.data && response.data.expense) {
      toast.success('Expense updated successfully');
        navigate('/admin/expenses/list');
      } else {
        toast.error('Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/expenses/list');
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setImageUploading(true);
      const result = await uploadToCloudinary(file);
      setFormData(prev => ({
        ...prev,
        billImageUrl: result.secure_url
      }));
      toast.success('Bill image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setImageUploading(false);
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Edit Expense</h1>
            <p className="mt-1 text-sm text-gray-500 hidden sm:block">Update expense details</p>
          </div>
      </div>
      
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Reason *
              </label>
              <input
                type="text"
                required
                  value={formData.expenseReason}
                  onChange={(e) => setFormData({ ...formData, expenseReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., Vegetables, Utilities"
              />
            </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
              </label>
              <input
                type="number"
                step="0.01"
                  required
                value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., Big Bazaar, Local Market"
              />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense By *
                </label>
                <input
                  type="text"
                  required
                  value={formData.expenseBy}
                  onChange={(e) => setFormData({ ...formData, expenseBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Staff member name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
              </label>
              <select 
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Additional details about the expense..."
              />
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Image
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  disabled={imageUploading}
                />
                {imageUploading && (
                  <div className="text-sm text-blue-600">Uploading image...</div>
                )}
                {formData.billImageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Current bill image:</p>
                    <img
                      src={formData.billImageUrl}
                      alt="Bill preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => window.open(formData.billImageUrl, '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>
          
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}