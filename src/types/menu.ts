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
  basePrice?: number;
  cost?: number;
  categoryId?: string | MenuCategory;
  category?: string;
  restaurantId: string;
  image?: string;
  status: 'active' | 'inactive';
  isVeg: boolean;
  displayOrder?: number;
  preparationTime: number;
  spiceLevel?: number;
  createdAt?: string;
  updatedAt?: string;
  spacePrices?: Array<{
    spaceId: string;
    spaceName: string;
    price: number;
  }>;
}

export interface MenuItemCreateInput {
  name: string;
  description?: string;
  price: number;
  cost: number;
  category: string;
  restaurantId: string;
  image?: string;
  isVeg?: boolean;
  preparationTime?: number;
  spiceLevel?: number;
}

export interface MenuCategoryCreateInput {
  name: string;
  description?: string;
  restaurantId: string;
}