import { useLocation, useNavigate } from "react-router-dom";
import { StaffTableMenuPage as StaffTableMenuPageComponent } from "../../components/StaffTableMenuPage";
import { toast } from "sonner";

export default function StaffTableMenuPage() {
  const location = useLocation();
  const navigate = useNavigate();

  console.log("StaffTableMenuPage loaded");
  console.log("Location state:", location.state);

  // Get table data from location state
  const tableData = location.state?.table;

  if (!tableData) {
    console.log("No table data found, showing error page");

    // Show error page instead of redirecting immediately
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-4">Table Not Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a table from the tables page before accessing the menu.
          </p>
          <button
            onClick={() => navigate("/order-tables")}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Tables
          </button>
        </div>
      </div>
    );
  }
  
  console.log("Table data found:", tableData);

  const handleBack = () => {
    navigate("/order-tables");
  };

  const handlePlaceOrder = (items: any[], persons: number) => {
    console.log("Order placed:", { items, persons, table: tableData });
    toast.success(`Order placed for Table ${tableData.tableName}`);
    // Here you would typically save the order to the database
    // For now, we'll just show a success message
  };

  return (
    <StaffTableMenuPageComponent
      tableId={tableData.id}
      tableName={tableData.tableName}
      onBack={handleBack}
      onPlaceOrder={handlePlaceOrder}
    />
  );
}
