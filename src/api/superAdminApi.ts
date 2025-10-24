const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

export interface SuperAdminLoginCredentials {
  username: string;
  password: string;
}

export interface RestaurantDetail {
  _id: string;
  name: string;
  adminUsername: string;
  subscription: {
    plan?: string;
    planName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    daysRemaining: number;
  };
  createdAt: string;
  updatedAt: string;
  staffCount: number;
}

export interface StaffMember {
  _id: string;
  username: string;
  password: string;
  restaurantId: string;
  createdAt: string;
}

export interface PlanDetail {
  _id: string;
  name: string;
  durationDays: number;
  price: number;
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalRestaurants: number;
  totalPlans: number;
  totalStaff: number;
  activeSubscriptions: number;
  expiringSoon: number;
  expired: number;
}

// Auth
export const superAdminLogin = async (credentials: SuperAdminLoginCredentials) => {
  const response = await fetch(`${API_BASE}/superadmin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  return response.json();
};

// Dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE}/superadmin/dashboard/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

// Restaurants
export const getAllRestaurants = async (): Promise<RestaurantDetail[]> => {
  const response = await fetch(`${API_BASE}/superadmin/restaurants`);
  if (!response.ok) throw new Error('Failed to fetch restaurants');
  return response.json();
};

export const getRestaurantById = async (id: string) => {
  const response = await fetch(`${API_BASE}/superadmin/restaurants/${id}`);
  if (!response.ok) throw new Error('Failed to fetch restaurant');
  return response.json();
};

export const createRestaurant = async (data: {
  name: string;
  adminUsername: string;
  adminPassword: string;
  planId?: string;
}) => {
  const response = await fetch(`${API_BASE}/superadmin/restaurants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create restaurant');
  }
  return response.json();
};

export const updateRestaurant = async (id: string, data: {
  name?: string;
  adminUsername?: string;
  planId?: string;
}) => {
  const response = await fetch(`${API_BASE}/superadmin/restaurants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update restaurant');
  }
  return response.json();
};

export const deleteRestaurant = async (id: string) => {
  const response = await fetch(`${API_BASE}/superadmin/restaurants/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete restaurant');
  }
  return response.json();
};

// Staff
export const getRestaurantStaff = async (restaurantId: string): Promise<StaffMember[]> => {
  const response = await fetch(`${API_BASE}/superadmin/restaurants/${restaurantId}/staff`);
  if (!response.ok) throw new Error('Failed to fetch staff');
  return response.json();
};

// Plans
export const getAllPlans = async (): Promise<PlanDetail[]> => {
  const response = await fetch(`${API_BASE}/superadmin/plans`);
  if (!response.ok) throw new Error('Failed to fetch plans');
  return response.json();
};

export const createPlan = async (data: {
  name: string;
  durationDays: number;
  price: number;
  features?: string[];
  isActive?: boolean;
}) => {
  const response = await fetch(`${API_BASE}/superadmin/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create plan');
  }
  return response.json();
};

export const updatePlan = async (id: string, data: {
  name?: string;
  durationDays?: number;
  price?: number;
  features?: string[];
  isActive?: boolean;
}) => {
  const response = await fetch(`${API_BASE}/superadmin/plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update plan');
  }
  return response.json();
};

export const deletePlan = async (id: string) => {
  const response = await fetch(`${API_BASE}/superadmin/plans/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete plan');
  }
  return response.json();
};
