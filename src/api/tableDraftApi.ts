import { makeApi } from './makeapi';

export interface TableDraft {
  _id?: string;
  tableId: string;
  tableName: string;
  restaurantId: string;
  persons: number;
  cartItems: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    note?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'occupied' | 'completed';
  lastUpdated: string;
  updatedBy: string;
}

export const saveTableDraft = async (draftData: Partial<TableDraft>) => {
  const response = await makeApi('/api/table-draft/save', 'POST', draftData);
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
