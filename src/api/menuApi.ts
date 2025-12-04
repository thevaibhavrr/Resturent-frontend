import { makeApi } from './makeapi';

export const getMenuItems = async (restaurantId: string, category?: string) => {
  const params = new URLSearchParams({ restaurantId });
  if (category && category !== 'all') {
    params.append('category', category);
  }
  
  const response = await makeApi(`/api/menu/items?${params.toString()}`, 'GET');
  return response.data;
};

export const getCategories = async (restaurantId: string) => {
  const response = await makeApi(`/api/menu/categories?restaurantId=${restaurantId}`, 'GET');
  return response.data;
};

export const getSpaces = async (restaurantId: string) => {
  const response = await makeApi(`/api/spaces?restaurantId=${restaurantId}`, 'GET');
  return response.data;
};

export const createMenuItem = async (menuItemData: any) => {
  const response = await makeApi('/api/menu/items', 'POST', menuItemData);
  return response.data;
};

export const createCategory = async (categoryData: any) => {
  const response = await makeApi('/api/menu/categories', 'POST', categoryData);
  return response.data;
};

export const updateMenuItem = async (id: string, menuItemData: any) => {
  const response = await makeApi(`/api/menu/items/${id}`, 'PUT', menuItemData);
  return response.data;
};

export const deleteMenuItem = async (id: string) => {
  const response = await makeApi(`/api/menu/items/${id}`, 'DELETE');
  return response.data;
};

// Category management functions
export const updateCategory = async (id: string, categoryData: any) => {
  const response = await makeApi(`/api/menu/categories/${id}`, 'PUT', categoryData);
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await makeApi(`/api/menu/categories/${id}`, 'DELETE');
  return response.data;
};

export const updateCategoryOrder = async (categories: any[]) => {
  const response = await makeApi('/api/menu/categories/order', 'PUT', { orders: categories });
  return response.data;
};