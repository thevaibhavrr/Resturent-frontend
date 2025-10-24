const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

export interface Plan {
  _id: string;
  name: string;
  durationDays: number;
  price: number;
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  plan?: string;
  planName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  daysRemaining: number;
}

export interface RestaurantSubscription {
  id: string;
  name: string;
  adminUsername: string;
  subscription: Subscription;
  createdAt: string;
}

// Get all available plans
export const getAllPlans = async (): Promise<Plan[]> => {
  const response = await fetch(`${API_BASE}/plan/plans`);
  if (!response.ok) throw new Error('Failed to fetch plans');
  return response.json();
};

// Get restaurant subscription status
export const getRestaurantSubscription = async (restaurantId: string): Promise<{ subscription: Subscription; restaurantName: string }> => {
  const response = await fetch(`${API_BASE}/plan/subscription/${restaurantId}`);
  if (!response.ok) throw new Error('Failed to fetch subscription');
  return response.json();
};

// Update restaurant plan
export const updateRestaurantPlan = async (restaurantId: string, planId: string): Promise<{ message: string; subscription: Subscription }> => {
  const response = await fetch(`${API_BASE}/plan/subscription/${restaurantId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planId }),
  });
  if (!response.ok) throw new Error('Failed to update plan');
  return response.json();
};

// Check subscription status
export const checkSubscriptionStatus = async (restaurantId: string): Promise<{
  isActive: boolean;
  daysRemaining: number;
  planName: string;
  endDate: string;
}> => {
  const response = await fetch(`${API_BASE}/plan/subscription/${restaurantId}/status`);
  if (!response.ok) throw new Error('Failed to check subscription status');
  return response.json();
};

// Get all restaurants with subscription info (admin only)
export const getAllRestaurantsSubscription = async (): Promise<RestaurantSubscription[]> => {
  const response = await fetch(`${API_BASE}/plan/restaurants/subscriptions`);
  if (!response.ok) throw new Error('Failed to fetch restaurants subscriptions');
  return response.json();
};
