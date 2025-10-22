import { useLocation, useNavigate } from "react-router-dom";
import { BillPage as BillPageComponent } from "../../components/BillPage";
import { toast } from "sonner";

export default function BillPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log("BillPage loaded");
  console.log("Location state:", location.state);
  
  // Get table data from location state
  const tableData = location.state?.table;
  const cartData = location.state?.cart;
  const personsData = location.state?.persons;
  
  if (!tableData) {
    console.log("No table data found, redirecting to /order-tables");
    navigate("/order-tables");
    return null;
  }
  
  console.log("Table data found:", tableData);
  console.log("Cart data:", cartData);
  console.log("Persons data:", personsData);

  const handleBack = () => {
    navigate("/order-tables");
  };

  return (
    <BillPageComponent
      tableId={tableData.id}
      tableName={tableData.tableName}
      initialCart={cartData || []}
      initialPersons={personsData || 1}
      onBack={handleBack}
    />
  );
}
