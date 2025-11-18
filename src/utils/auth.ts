// Authentication and user management utilities

export interface User {
  id: string;
  username: string;
  name: string;
  role: "admin" | "staff";
  restaurantId: string;
  restaurantName: string;
}

export interface Restaurant {
  id: string;
  name: string;
  adminUsername: string;
  adminPassword: string;
}

// Default restaurants data
const defaultRestaurants: Restaurant[] = [
  {
    id: "dev-restaurant",
    name: "Dev Restaurant",
    adminUsername: "devrestaurant",
    adminPassword: "1234",
  },
  {
    id: "divya-restaurant",
    name: "Divya Restaurant",
    adminUsername: "divyarestaurant",
    adminPassword: "1234",
  },
];

// Initialize restaurants in localStorage
export const initializeRestaurants = () => {
  const stored = localStorage.getItem("restaurants");
  if (!stored) {
    localStorage.setItem("restaurants", JSON.stringify(defaultRestaurants));
  }
};

// Get all restaurants
export const getRestaurants = (): Restaurant[] => {
  const stored = localStorage.getItem("restaurants");
  return stored ? JSON.parse(stored) : defaultRestaurants;
};

// Get all staff users
export const getStaffUsers = () => {
  const stored = localStorage.getItem("staff_users");
  if (!stored) {
    // Default staff users
    const defaultStaff = [
      {
        id: "staff-1",
        username: "devrestaurantstaff",
        password: "1234",
        restaurantId: "dev-restaurant",
      },
      {
        id: "staff-2",
        username: "divyastaff",
        password: "1234",
        restaurantId: "divya-restaurant",
      },
    ];
    localStorage.setItem("staff_users", JSON.stringify(defaultStaff));
    return defaultStaff;
  }
  return JSON.parse(stored);
};

// Authenticate user
export const authenticateUser = (
  username: string,
  password: string
): User | null => {
  // Check if admin
  const restaurants = getRestaurants();
  const restaurant = restaurants.find(
    (r) => r.adminUsername === username && r.adminPassword === password
  );

  if (restaurant) {
    return {
      id: restaurant.id,
      username: restaurant.adminUsername,
      name: "Admin",
      role: "admin",
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    };
  }

  // Check if staff
  const staffUsers = getStaffUsers();
  const staff = staffUsers.find(
    (staffUser: any) => staffUser.username === username && staffUser.password === password
  );

  if (staff) {
    const staffRestaurant = restaurants.find(
      (r) => r.id === staff.restaurantId
    );
    return {
      id: staff.id,
      username: staff.username,
      name: staff.name || staff.username, // Use name if available, otherwise fallback to username
      role: "staff",
      restaurantId: staff.restaurantId,
      restaurantName: staffRestaurant?.name || "Unknown",
    };
  }

  return null;
};

// Save current user to localStorage
export const saveCurrentUser = (user: User) => {
  localStorage.setItem("currentUser", JSON.stringify(user));
};

// Get current user from localStorage
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem("currentUser");
  return stored ? JSON.parse(stored) : null;
};

// Logout
export const logout = () => {
  localStorage.removeItem("currentUser");
};

// Get restaurant-specific key for localStorage
export const getRestaurantKey = (key: string, restaurantId: string): string => {
  return `${restaurantId}_${key}`;
};
