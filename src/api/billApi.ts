import { makeApi } from "./makeapi";

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  spiceLevel?: number;
  spicePercent?: number;
  isJain?: boolean;
}

export interface Bill {
  _id: string;
  billNumber: string;
  tableId: string;
  tableName: string;
  persons: number;
  items: BillItem[];
  subtotal: number;
  additionalCharges: Array<{ name: string; amount: number }>;
  discountAmount: number;
  grandTotal: number;
  createdAt: string;
  createdBy: string;
  status: string;
}

export interface BillStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItems: number;
}

export interface CreateBillData {
  billNumber: string;
  tableId: string;
  tableName: string;
  persons: number;
  items: BillItem[];
  subtotal: number;
  additionalCharges?: Array<{ name: string; amount: number }>;
  discountAmount?: number;
  grandTotal: number;
  restaurantId?: string; // Optional, will use from JWT if not provided
  createdBy?: string; // Optional, will use from JWT if not provided
}

/**
 * Create a new bill
 */
export const createBill = async (billData: CreateBillData): Promise<Bill> => {
  try {
    const response = await makeApi('/api/bills', 'POST', billData);
    if (response.data && response.data.bill) {
      return response.data.bill;
    }
    // Handle case where response structure might be different
    if (response.data) {
      return response.data;
    }
    throw new Error('Invalid response from server');
  } catch (error: any) {
    console.error('Error creating bill:', error);
    // Re-throw with more context
    if (error.response) {
      const errorMsg = error.response.data?.error || error.response.data?.message || 'Failed to save bill';
      throw new Error(errorMsg);
    }
    throw error;
  }
};

/**
 * Get all bills for the restaurant
 */
export const getBills = async (params?: {
  startDate?: string;
  endDate?: string;
  tableId?: string;
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<{ bills: Bill[]; total: number }> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.tableId) queryParams.append('tableId', params.tableId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.skip) queryParams.append('skip', params.skip.toString());

  const url = `/api/bills${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeApi(url, 'GET');
  return response.data;
};

/**
 * Get bill statistics
 */
export const getBillStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<BillStats> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = `/api/bills/stats${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeApi(url, 'GET');
  return response.data;
};

/**
 * Get a single bill by ID
 */
export const getBillById = async (id: string): Promise<Bill> => {
  const response = await makeApi(`/api/bills/${id}`, 'GET');
  return response.data;
};

/**
 * Delete a bill
 */
export const deleteBill = async (id: string): Promise<void> => {
  await makeApi(`/api/bills/${id}`, 'DELETE');
};

