export interface MenuCategory {
  _id?: string;
  name: string;
  description?: string;
  restaurantId: string;
  status: 'active' | 'inactive';
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string | MenuCategory;
  restaurantId: string;
  image?: string;
  status: 'active' | 'inactive';
  isVeg: boolean;
  displayOrder: number;
  preparationTime: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemCreateInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  restaurantId: string;
  image?: string;
  isVeg?: boolean;
  preparationTime?: number;
}

export interface MenuCategoryCreateInput {
  name: string;
  description?: string;
  restaurantId: string;
}