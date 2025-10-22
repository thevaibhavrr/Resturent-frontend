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
    console.log("No table data found, redirecting to /order-tables");
    // Redirect back to tables if no table data
    navigate("/order-tables");
    return null;
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
