import { useLocation, useNavigate } from "react-router-dom";
import { BillPage } from "../../components/BillPage";
import { toast } from "sonner";

export default function AdminBillPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const billData = location.state;
  
  if (!billData) {
    toast.error("No bill data found");
    navigate("/admin/order-tables");
    return null;
  }

  const handleBack = () => {
    navigate("/admin/order-tables");
  };

  const handleSaveAndPrint = (data: any) => {
    // Navigate to print bill page
    navigate("/admin/order-tables/print-bill", { state: data });
  };

  return (
    <BillPage
      tableId={billData.table.id}
      tableName={billData.table.tableName}
      initialPersons={billData.persons}
      initialCart={billData.cart}
      onBack={handleBack}
      onSaveAndPrint={handleSaveAndPrint}
    />
  );
}
