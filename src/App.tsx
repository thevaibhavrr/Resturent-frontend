import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { AdminSidebar } from "./components/AdminSidebar";
import { StaffSidebar } from "./components/StaffSidebar";
import Header from "./components/Header";
import DashboardPage from "./pages/admin/DashboardPage";
import ManageTablesPage from "./pages/admin/ManageTablesPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import LocationManagementPage from "./pages/admin/LocationManagementPage";
import MenuManagementPage from "./pages/admin/MenuManagementPage";
import CategoryManagementPage from "./pages/admin/CategoryManagementPage";
import BillHistoryPage from "./pages/admin/BillHistoryPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import PlansPage from "./pages/admin/PlansPage";
import AdminOrderTablesPage from "./pages/admin/AdminOrderTablesPage";
import AdminTableMenuPage from "./pages/admin/AdminTableMenuPage";
import AdminBillPage from "./pages/admin/AdminBillPage";
import AdminPrintDraftPage from "./pages/admin/AdminPrintDraftPage";
import AdminPrintBillPage from "./pages/admin/AdminPrintBillPage";
import UserBillsPage from "./pages/admin/UserBillsPage";
import { TablesPage } from "./components/TablesPage";
import { MenuPage } from "./components/MenuPage";
import { BillPage } from "./components/BillPage";
import { PrintBill } from "./components/PrintBill";
import StaffTableMenuPage from "./pages/staff/StaffTableMenuPage";
import StaffBillPage from "./pages/staff/BillPage";
import StaffBillHistoryPage from "./pages/staff/BillHistoryPage";
import PrintDraftPage from "./pages/staff/PrintDraftPage";
import PrintBillPage from "./pages/staff/PrintBillPage";
import { TestNavigation } from "./components/TestNavigation";
import { colorThemes } from "./components/ThemeCustomizer";
import { Toaster } from "./components/ui/sonner";
import { getCurrentUser, getRestaurantKey } from "./utils/auth";
import { SubscriptionAlert } from "./components/SubscriptionAlert";
import { SubscriptionExpiredModal } from "./components/SubscriptionExpiredModal";
import { getRestaurantSubscription } from "./api/planApi";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import ExpensesListPage from "./pages/ExpensesListPage";
import AddExpensePage from "./pages/AddExpensePage";
import EditExpensePage from "./pages/EditExpensePage";

interface TableData {
  id: number;
  tableName: string;
  location: string;
  lastOrderTime: string;
  persons: number;
  totalAmount: number;
  status: "available" | "occupied" | "reserved";
  cartItems: Array<{ id: number; name: string; price: number; quantity: number }>;
}

// Helper function to get table data
const getTableData = (tableId: number, restaurantId: string): Partial<TableData> => {
  const key = getRestaurantKey(`table_${tableId}`, restaurantId);
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    lastOrderTime: "-",
    persons: 0,
    totalAmount: 0,
    status: "available",
    cartItems: [],
  };
};

interface BillData {
  tableId: number;
  tableName: string;
  persons: number;
  items: Array<{ id: number; name: string; price: number; quantity: number }>;
  existingTotal: number;
}

interface PrintData {
  billNumber: string;
  tableName: string;
  persons: number;
  items: Array<{ id: number; name: string; price: number; quantity: number }>;
  additionalCharges: Array<{ id: number; name: string; amount: number }>;
  discountAmount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  // Remove currentPage, navigation will be handled by react-router
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentTheme, setCurrentTheme] = useState("ocean");
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [tableUpdates, setTableUpdates] = useState(0);
  
  // Subscription state
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Check subscription status
  const checkSubscription = async (restaurantId: string) => {
    try {
      const response = await getRestaurantSubscription(restaurantId);
      const subscription = response.subscription;
      
      if (!subscription.isActive || subscription.daysRemaining <= 0) {
        setSubscriptionExpired(true);
        setSubscriptionData({
          restaurantName: response.restaurantName,
          planName: subscription.planName,
          endDate: subscription.endDate,
          daysRemaining: subscription.daysRemaining
        });
      } else {
        setSubscriptionExpired(false);
        setSubscriptionData(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
      // Check subscription status only for admin users
      if (user.restaurantId && user.role === "admin") {
        checkSubscription(user.restaurantId);
      }
    }
  }, []);

  // Apply theme
  useEffect(() => {
    const theme = colorThemes.find((t) => t.id === currentTheme);
    if (theme) {
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    }
  }, [currentTheme]);

  // Get tables data
  const getTablesData = (): TableData[] => {
    if (!currentUser) return [];
    
    const key = getRestaurantKey("tables", currentUser.restaurantId);
    const stored = localStorage.getItem(key);
    const tables = stored ? JSON.parse(stored) : [];

    return tables.map((table: any) => {
      const storedData = getTableData(table.id, currentUser.restaurantId);
      return {
        ...table,
        lastOrderTime: storedData.lastOrderTime || "-",
        persons: storedData.persons || 0,
        totalAmount: storedData.totalAmount || 0,
        status: storedData.status || "available",
        cartItems: storedData.cartItems || [],
      };
    });
  };

  const handleLogin = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsLoggedIn(true);
    
    // Check subscription status after login (only for admin)
    if (user && user.restaurantId && user.role === "admin") {
      checkSubscription(user.restaurantId);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedTable(null);
    setBillData(null);
    setPrintData(null);
  };

  const handleTableSelect = (table: TableData) => {
    setSelectedTable(table);
  };

  const handleBackFromMenu = () => {
    setSelectedTable(null);
    if (currentUser?.role === "admin") {
      navigate("/admin");
    }
    setTableUpdates((prev) => prev + 1);
  };

  const handlePlaceOrder = (
    items: Array<{ id: number; name: string; price: number; quantity: number }>,
    persons: number
  ) => {
    if (selectedTable) {
      setBillData({
        tableId: selectedTable.id,
        tableName: selectedTable.tableName,
        persons: persons,
        items: items,
        existingTotal: selectedTable.totalAmount,
      });
      setSelectedTable(null);
    }
  };

  const handleBackFromBill = () => {
    setBillData(null);
    if (currentUser?.role === "admin") {
      navigate("/admin");
    }
    setTableUpdates((prev) => prev + 1);
  };

  const handleSaveAndPrint = (data: any) => {
    setPrintData(data);
    setBillData(null);
  };

  const handleBackFromPrint = () => {
    setPrintData(null);
    if (currentUser?.role === "admin") {
      navigate("/admin");
    }
    setTableUpdates((prev) => prev + 1);
  };

  const [menuOpen, setMenuOpen] = useState(false);

  // Public routes that don't require authentication
  if (location.pathname === '/privacy-policy') {
    return <PrivacyPolicyPage />;
  }

  if (location.pathname === '/terms-and-conditions') {
    return <TermsAndConditionsPage />;
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <>
        <Toaster />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // Show print page
  if (printData) {
    return (
      <>
        <Toaster />
        <PrintBill
          billNumber={printData.billNumber}
          tableName={printData.tableName}
          persons={printData.persons}
          items={printData.items}
          additionalCharges={printData.additionalCharges}
          discountAmount={printData.discountAmount}
          cgst={printData.cgst}
          sgst={printData.sgst}
          grandTotal={printData.grandTotal}
          onBack={handleBackFromPrint}
        />
      </>
    );
  }

  if (billData) {
    return (
      <>
        <Toaster />
        <BillPage
          tableId={billData.tableId}
          tableName={billData.tableName}
          initialPersons={billData.persons}
          initialCart={billData.items}
          onBack={handleBackFromBill}
          onSaveAndPrint={handleSaveAndPrint}
        />
      </>
    );
  }

  // Show menu page
  if (selectedTable) {
    return (
      <>
        <Toaster />
        <MenuPage
          tableId={selectedTable.id}
          tableName={selectedTable.tableName}
          persons={selectedTable.persons}
          existingCart={selectedTable.cartItems}
          existingTotal={selectedTable.totalAmount}
          onBack={handleBackFromMenu}
          onPlaceOrder={handlePlaceOrder}
        />
      </>
    );
  }

  // Admin Interface
  if (currentUser?.role === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <SubscriptionAlert />
        {/* Show subscription expired modal */}
        {subscriptionExpired && subscriptionData && (
          <SubscriptionExpiredModal
            restaurantName={subscriptionData.restaurantName}
            planName={subscriptionData.planName}
            endDate={subscriptionData.endDate}
            daysRemaining={subscriptionData.daysRemaining}
          />
        )}
        <div className="lg:hidden">
          <Header onToggleMenu={() => setMenuOpen((s) => !s)} onLogout={handleLogout} />
        </div>
        <AdminSidebar onLogout={handleLogout} menuOpen={menuOpen} onCloseMenu={() => setMenuOpen(false)} />
        <main className="lg:ml-64 pt-20 lg:pt-0">
          <Routes>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/order-tables" element={<AdminOrderTablesPage />} />
            <Route path="/admin/order-tables/table-menu" element={<AdminTableMenuPage />} />
            <Route path="/admin/order-tables/bill" element={<AdminBillPage />} />
            <Route path="/admin/order-tables/print-draft" element={<AdminPrintDraftPage />} />
            <Route path="/admin/order-tables/print-bill" element={<AdminPrintBillPage />} />
            <Route path="/admin/tables" element={<ManageTablesPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/locations" element={<LocationManagementPage />} />
            <Route path="/admin/menu" element={<MenuManagementPage />} />
            <Route path="/admin/categories" element={<CategoryManagementPage />} />
            <Route path="/admin/bills" element={<BillHistoryPage />} />
            <Route path="/admin/user-bills" element={<UserBillsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/plans" element={<PlansPage />} />
            <Route path="/admin/expenses">
              <Route path="list" element={<ExpensesListPage />} />
              <Route path="add" element={<AddExpensePage />} />
              <Route path="edit/:id" element={<EditExpensePage />} />
              <Route path="*" element={<Navigate to="list" replace />} />
            </Route>
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Staff Interface - Tables Page
  // Show header only on /order-tables page
  const showHeader = location.pathname === "/order-tables";
  
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* Subscription alert and modal only shown to admin, not staff */}
      {/* Show header only on /order-tables page for staff */}
      {showHeader && (
        <div className="lg:hidden">
          <Header onToggleMenu={() => setMenuOpen((s) => !s)} onLogout={handleLogout} />
        </div>
      )}
      <StaffSidebar onLogout={handleLogout} menuOpen={menuOpen} onCloseMenu={() => setMenuOpen(false)} />
      <main className={`lg:ml-64 ${showHeader ? 'pt-20' : 'pt-0'} lg:pt-0`}>
        <Routes>
      <Route path="/order-tables" element={
        <TablesPage
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onTableSelect={handleTableSelect}
        />
      } />
      <Route path="/order-tables/table-menu" element={<StaffTableMenuPage />} />
      <Route path="/order-tables/print-draft" element={<PrintDraftPage />} />
      <Route path="/order-tables/print-bill" element={<PrintBillPage />} />
      <Route path="/order-tables/bill" element={<StaffBillPage />} />
      <Route path="/order-tables/history" element={<StaffBillHistoryPage />} />
      <Route path="/order-tables/test" element={<TestNavigation />} />
      <Route path="/order-tables/tables" element={<Navigate to="/order-tables" />} />
      <Route path="/staff" element={<Navigate to="/order-tables" />} />
      <Route path="/staff/table-menu" element={<Navigate to="/order-tables/table-menu" />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      <Route path="*" element={<Navigate to="/order-tables" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
