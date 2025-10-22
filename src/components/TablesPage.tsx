import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { getAllTables } from "../api/tableApi";
import { getAllTableDrafts } from "../api/tableDraftApi";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";
import { toast } from "sonner";
import { TableCard } from "./TableCard";
import { useNavigate } from "react-router-dom";

interface Table {
  _id: string;
  tableName: string;
  locationId: {
    _id: string;
    name: string;
  };
  restaurantId: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface TablesPageProps {
  tables?: Table[];
  activeFilter?: string;
  setActiveFilter?: (filter: string) => void;
  onTableSelect?: (table: any) => void;
}

const filters = [
  { id: "all", label: "All Tables" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

export function TablesPage({ 
  tables: propTables, 
  activeFilter: propActiveFilter = "all", 
  setActiveFilter: propSetActiveFilter,
  onTableSelect 
}: TablesPageProps = {}) {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>(propTables || []);
  const [activeFilter, setActiveFilter] = useState(propActiveFilter);
  const [loading, setLoading] = useState(!propTables);
  const [tableDrafts, setTableDrafts] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>(() => {
    const u = getCurrentUser();
    if (!u?.restaurantId) return "all";
    const key = getRestaurantKey("selected_space", u.restaurantId);
    return localStorage.getItem(key) || "all";
  });

  useEffect(() => {
    if (!propTables) {
      loadTables();
    }
    loadTableDrafts();
    
    // Refresh table drafts every 30 seconds
    const interval = setInterval(() => {
      loadTableDrafts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [propTables]);

  // Persist selected space per restaurant
  useEffect(() => {
    if (!user?.restaurantId) return;
    const key = getRestaurantKey("selected_space", user.restaurantId);
    try {
      localStorage.setItem(key, selectedSpace);
    } catch {}
  }, [selectedSpace, user?.restaurantId]);

  // Load table drafts to check occupied status
  const loadTableDrafts = async () => {
    if (!user?.restaurantId) return;
    
    try {
      const drafts = await getAllTableDrafts(user.restaurantId);
      console.log("Loaded table drafts:", drafts);
      setTableDrafts(drafts);
    } catch (error) {
      console.error("Error loading table drafts:", error);
    }
  };

  const loadTables = async () => {
    if (!user) {
      console.log("No user found, cannot load tables");
      toast.error("Please login to view tables");
      return;
    }
    
    console.log("Loading tables for restaurant:", user.restaurantId);
    try {
      setLoading(true);
      const tablesData = await getAllTables(user.restaurantId);
      console.log("Tables loaded:", tablesData);
      setTables(tablesData);
    } catch (error) {
      console.error("Error loading tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  // Build unique list of spaces (locations)
  const spaces = Array.from(
    new Map(
      tables.map((t) => [t.locationId?._id, { id: t.locationId?._id, name: t.locationId?.name || "Unknown Location" }])
    ).values()
  ).filter((s) => !!s.id);

  // Apply space filter
  const filteredTables = tables.filter((table) => {
    if (selectedSpace === "all") return true;
    return table.locationId?._id === selectedSpace;
  });

  

  // Check if table is occupied (has draft with items)
  const isTableOccupied = (table: Table) => {
    const draft = tableDrafts.find(d => d.tableId === table._id);
    console.log(`Checking table ${table._id}:`, { draft, hasItems: draft?.cartItems?.length > 0 });
    return draft && draft.cartItems && draft.cartItems.length > 0;
  };

  // Get table status based on draft
  const getTableStatus = (table: Table) => {
    const isOccupied = isTableOccupied(table);
    console.log(`Table ${table._id} status:`, { isOccupied, originalStatus: table.status });
    if (isOccupied) {
      return "occupied";
    }
    return table.status === "active" ? "available" : "reserved";
  };

  // Compute status counts for current selection
  const statusCounts = filteredTables.reduce(
    (acc, t) => {
      const s = getTableStatus(t) as "available" | "occupied" | "reserved";
      acc.total += 1;
      acc[s] += 1;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, reserved: 0 }
  );

  const handleTableSelect = (table: Table) => {
    console.log("Selected table:", table);
    console.log("Current user:", user);
    console.log("User role:", user?.role);
    
    // For staff users, navigate to the staff table menu page
    if (user?.role === "staff") {
      console.log("Navigating to staff table menu page");
      const tableData = {
        id: table._id, // Use the actual MongoDB _id
        tableName: table.tableName,
        location: table.locationId?.name || "Unknown Location",
        lastOrderTime: "-",
        persons: 0,
        totalAmount: 0,
        status: getTableStatus(table),
        cartItems: []
      };
      console.log("Table data:", tableData);
      navigate("/order-tables/table-menu", { state: { table: tableData } });
      return;
    }
    
    // Convert backend table format to frontend format
    const tableData = {
      id: table._id, // Use the actual MongoDB _id
      tableName: table.tableName,
      location: table.locationId?.name || "Unknown Location",
      lastOrderTime: "-",
      persons: 0,
      totalAmount: 0,
      status: getTableStatus(table),
      cartItems: []
    };
    
    if (onTableSelect) {
      onTableSelect(tableData);
    } else {
      // Fallback: navigate to menu page with table data
      navigate("/menu", { state: { table: tableData } });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl">Tables</h1>
          <p className="text-sm text-muted-foreground">Manage restaurant tables</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Spaces horizontal scrollbar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
            <Button
              variant={selectedSpace === "all" ? "default" : "outline"}
              onClick={() => setSelectedSpace("all")}
              className="whitespace-nowrap"
            >
              Show All
            </Button>
            {spaces.map((space) => (
              <Button
                key={space.id}
                variant={selectedSpace === space.id ? "default" : "outline"}
                onClick={() => setSelectedSpace(space.id!)}
                className="whitespace-nowrap"
              >
                {space.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Refresh (right aligned) */}
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg flex w-full items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTableDrafts}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Drafts
          </Button>
        </div>

        {/* Stats Summary for current space */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-card border">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl mt-1">{statusCounts.total}</p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl mt-1 text-green-600">{statusCounts.available}</p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="text-2xl mt-1 text-amber-600">{statusCounts.occupied}</p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="text-2xl mt-1 text-blue-600">{statusCounts.reserved}</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tables...</p>
          </div>
        )}

        {/* Tables Grid - two per row */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTables.map((table) => {
              // Get draft information for this table
              const draft = tableDrafts.find(d => d.tableId === table._id);
              const isOccupied = draft && draft.cartItems && draft.cartItems.length > 0;
              
              console.log(`Rendering table ${table._id}:`, {
                draft,
                isOccupied,
                persons: draft?.persons,
                total: draft?.total,
                cartItems: draft?.cartItems?.length
              });
              
              // Format last order time
              const lastOrderTime = draft?.lastUpdated 
                ? new Date(draft.lastUpdated).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })
                : "-";
              
              return (
                <TableCard
                  key={table._id}
                  tableName={table.tableName}
                  location={table.locationId?.name || "Unknown Location"}
                  lastOrderTime={lastOrderTime}
                  persons={draft?.persons || 0}
                  totalAmount={draft?.total || 0}
                  status={getTableStatus(table)}
                  onClick={() => handleTableSelect(table)}
                />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTables.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No tables found in this section
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
