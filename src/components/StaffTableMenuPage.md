# Staff Table Menu Page

## Overview
The `StaffTableMenuPage` component provides a comprehensive interface for staff members to manage table orders. When a staff member clicks on a table, they are redirected to this specific page with search functionality, category filtering, and product management.

## Features

### 🔍 Search Functionality
- Real-time search across all menu items
- Case-insensitive search
- Searches by item name

### 📂 Category Filtering
- **All Items**: Shows all menu items
- **Appetizers**: Salads, bruschetta, wings, etc.
- **Main Course**: Steaks, salmon, curry, pasta, etc.
- **Desserts**: Cakes, tiramisu, etc.
- **Beverages**: Juices, coffee, tea, etc.
- **Soups**: Various soup options

### 🛒 Shopping Cart
- Add/remove items with quantity controls
- Real-time total calculation
- Tax calculation (10%)
- Person count management
- Order placement functionality

### 🎨 UI Components
- Responsive grid layout
- Sticky cart sidebar
- Image previews for menu items
- Spice level indicators
- Status badges and icons

## Usage

```tsx
<StaffTableMenuPage
  tableId={123}
  tableName="Table 5"
  onBack={() => setSelectedTable(null)}
  onPlaceOrder={(items, persons) => handleOrder(items, persons)}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `tableId` | `number` | Unique identifier for the table |
| `tableName` | `string` | Display name of the table |
| `onBack` | `() => void` | Callback when user wants to go back |
| `onPlaceOrder` | `(items: CartItem[], persons: number) => void` | Callback when order is placed |

## Menu Items Structure

```typescript
interface MenuItem {
  id: number;
  name: string;
  image: string;
  price: number;
  spiceLevel: number; // 1-5 scale
  category: string;
}
```

## Cart Items Structure

```typescript
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}
```

## Integration with TablesPage

The component is automatically shown when:
1. User role is "staff"
2. A table is selected from the tables grid
3. The `selectedTable` state is set

## Navigation Flow

1. **Staff Dashboard** → **Tables Page**
2. **Click Table** → **Staff Table Menu Page**
3. **Add Items to Cart** → **Review Order**
4. **Place Order** → **Back to Tables Page**

## Styling

- Uses Tailwind CSS for responsive design
- Follows the existing design system
- Dark/light mode compatible
- Mobile-first approach
