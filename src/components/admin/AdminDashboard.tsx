import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  TableProperties,
  UtensilsCrossed,
} from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";

export function AdminDashboard() {
  const user = getCurrentUser();
  const [stats, setStats] = useState({
    totalTables: 0,
    occupiedTables: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalMenuItems: 0,
    totalStaff: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    if (!user) return;

    // Get tables
    const tablesKey = getRestaurantKey("tables", user.restaurantId);
    const tables = JSON.parse(localStorage.getItem(tablesKey) || "[]");
    const occupied = tables.filter((t: any) => t.status === "occupied").length;

    // Get menu items
    const menuKey = getRestaurantKey("menuItems", user.restaurantId);
    const menuItems = JSON.parse(localStorage.getItem(menuKey) || "[]");

    // Get bill history
    const historyKey = getRestaurantKey("billHistory", user.restaurantId);
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    const totalRevenue = history.reduce(
      (sum: number, bill: any) => sum + bill.grandTotal,
      0
    );

    // Get staff
    const staffUsers = JSON.parse(localStorage.getItem("staff_users") || "[]");
    const restaurantStaff = staffUsers.filter(
      (s: any) => s.restaurantId === user.restaurantId
    );

    setStats({
      totalTables: tables.length,
      occupiedTables: occupied,
      totalOrders: history.length,
      totalRevenue,
      totalMenuItems: menuItems.length,
      totalStaff: restaurantStaff.length,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Total Tables */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Tables</p>
            <TableProperties className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalTables}</p>
            <p className="text-xs text-muted-foreground">
              {stats.occupiedTables} occupied
            </p>
          </div>
        </Card>

        {/* Total Orders */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <ShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
        </Card>

        {/* Total Revenue */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">₹{stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
        </Card>

        {/* Menu Items */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Menu Items</p>
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalMenuItems}</p>
            <p className="text-xs text-muted-foreground">Active items</p>
          </div>
        </Card>

        {/* Staff Members */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Staff Members</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalStaff}</p>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </div>
        </Card>

        {/* Table Occupancy */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Occupancy Rate</p>
            <TrendingUp className="w-5 h-5 text-pink-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">
              {stats.totalTables > 0
                ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground">Current occupancy</p>
          </div>
        </Card>
      </div>

  {/* Quick Actions */}
  <Card className="p-6 shadow-lg">
        <h2 className="text-xl mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <TableProperties className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">Add Table</p>
            <p className="text-xs text-muted-foreground">Create new table</p>
          </div>
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <Users className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">Add Staff</p>
            <p className="text-xs text-muted-foreground">Create staff account</p>
          </div>
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <UtensilsCrossed className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">Add Menu Item</p>
            <p className="text-xs text-muted-foreground">Add to menu</p>
          </div>
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <ShoppingCart className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">View Orders</p>
            <p className="text-xs text-muted-foreground">Check bill history</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
