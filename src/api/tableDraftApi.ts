import { makeApi } from './makeapi';

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  spiceLevel?: number;
  spicePercent?: number;
  addedBy?: {
    userId: string;
    userName: string;
  };
  lastUpdatedBy?: {
    userId: string;
    userName: string;
    timestamp: string;
  };
  updatedBy?: string;
}

export interface TableDraft {
  _id?: string;
  tableId: string;
  tableName: string;
  restaurantId: string;
  persons: number;
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'occupied' | 'completed';
  lastUpdated: string;
  updatedBy: string;
  userId?: string; // Add userId to the interface
}

export const saveTableDraft = async (draftData: Partial<TableDraft> & { userId: string }) => {
  const response = await makeApi('/api/table-draft/save', 'POST', {
    ...draftData,
    // Make sure we're sending both updatedBy and userId
    userId: draftData.userId,
    updatedBy: draftData.updatedBy || 'Unknown User'
  });
  return response.data;
};

export const getTableDraft = async (tableId: string, restaurantId: string) => {
  const response = await makeApi(`/api/table-draft/get?tableId=${tableId}&restaurantId=${restaurantId}`, 'GET', undefined);
  return response.data;
};

export const getAllTableDrafts = async (restaurantId: string) => {
  const response = await makeApi(`/api/table-draft/all?restaurantId=${restaurantId}`, 'GET', undefined);
  return response.data;
};

export const deleteTableDraft = async (tableId: string, restaurantId: string) => {
  const response = await makeApi('/api/table-draft/delete', 'DELETE', { tableId, restaurantId });
  return response.data;
};

export const clearTableDraft = async (tableId: string, restaurantId: string, updatedBy: string) => {
  const response = await makeApi('/api/table-draft/clear', 'POST', { tableId, restaurantId, updatedBy });
  return response.data;
};
