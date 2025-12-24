import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser } from '../utils/auth';
import { makeApi } from '../api/makeapi';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

type IncomeData = {
  _id: string;
  incomeSource: string;
  amount: number;
  incomeType: 'cash' | 'online';
  incomeDate: string;
  description?: string;
  category: string;
  paymentReference?: string;
  recordedBy: string;
  restaurantId: string;
  billImageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function EditIncomePage() {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    incomeSource: '',
    amount: '',
    incomeType: 'cash' as 'cash' | 'online',
    incomeDate: '',
    description: '',
    category: '',
    paymentReference: '',
    recordedBy: '',
    billImageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const restaurantId = user?.restaurantId;

  useEffect(() => {
    const fetchIncome = async () => {
      if (!id || !restaurantId) return;

      try {
        setLoading(true);
        const response = await makeApi(`/api/extra-income/${id}?restaurantId=${restaurantId}`, 'GET');

        if (response.data) {
          const incomeData = response.data;
          setFormData({
            incomeSource: incomeData.incomeSource,
            amount: incomeData.amount.toString(),
            incomeType: incomeData.incomeType,
            incomeDate: new Date(incomeData.incomeDate).toISOString().split('T')[0],
            description: incomeData.description || '',
            category: incomeData.category,
            paymentReference: incomeData.paymentReference || '',
            recordedBy: incomeData.recordedBy,
            billImageUrl: incomeData.billImageUrl || ''
          });
        } else {
          toast.error('Failed to load income details');
        }
      } catch (error) {
        console.error('Error fetching income:', error);
        toast.error('Failed to load income details');
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
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

      const response = await makeApi(`/api/extra-income/${id}`, 'PUT', updateData);

      if (response.data && response.data.extraIncome) {
        toast.success('Income updated successfully');
        navigate('/admin/income/list');
      } else {
        toast.error('Failed to update income');
      }
    } catch (error) {
      console.error('Error updating income:', error);
      toast.error('Failed to update income');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/income/list');
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Edit Income</h1>
            <p className="mt-1 text-sm text-gray-500 hidden sm:block">Update income details</p>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Income Source *
                </label>
                <input
                  type="text"
                  required
                  value={formData.incomeSource}
                  onChange={(e) => setFormData({ ...formData, incomeSource: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., Event Catering, Partnership"
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
                  Income Type *
                </label>
                <select
                  required
                  value={formData.incomeType}
                  onChange={(e) => setFormData({ ...formData, incomeType: e.target.value as 'cash' | 'online' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>

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
                  <option value="Events">Events</option>
                  <option value="Catering">Catering</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Partnerships">Partnerships</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Income Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.incomeDate}
                  onChange={(e) => setFormData({ ...formData, incomeDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recorded By *
                </label>
                <input
                  type="text"
                  required
                  value={formData.recordedBy}
                  onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Staff member name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference
              </label>
              <input
                type="text"
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Transaction ID, Invoice #, etc."
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
                placeholder="Additional details about the income..."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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
                {saving ? 'Updating...' : 'Update Income'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
