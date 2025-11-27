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
    // Navigate to print bill page for printing
    navigate("/admin/order-tables/print-bill", { state: data, replace: true });
  };

  return (
    <BillPage
      tableId={billData.table.id}
      tableName={billData.table.tableName}
      initialPersons={billData.persons}
      initialCart={billData.cart}
      initialTotalDiscount={billData.totalDiscount || 0}
      initialAdditionalPrice={billData.additionalPrice || 0}
      onBack={handleBack}
      onSaveAndPrint={handleSaveAndPrint}
      isEdit={billData.isEdit || false}
      originalBillId={billData.originalBillId}
      originalBillNumber={billData.originalBillNumber}
    />
  );
}
