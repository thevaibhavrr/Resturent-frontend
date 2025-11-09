import { useLocation, useNavigate } from "react-router-dom";
import { BillPage as BillPageComponent } from "../../components/BillPage";
import { toast } from "sonner";

export default function BillPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get table data from location state
  const tableData = location.state?.table;
  const cartData = location.state?.cart;
  const personsData = location.state?.persons;
  
  if (!tableData) {
    navigate("/order-tables");
    return null;
  }

  const handleBack = () => {
    navigate("/order-tables");
  };

  const handleSaveAndPrint = (printData: any) => {
    // Navigate to print page with print data
    navigate("/order-tables/print-bill", { state: { printData } });
  };

  return (
    <BillPageComponent
      tableId={tableData.id}
      tableName={tableData.tableName}
      initialCart={cartData || []}
      initialPersons={personsData || 1}
      onBack={handleBack}
      onSaveAndPrint={handleSaveAndPrint}
    />
  );
}
