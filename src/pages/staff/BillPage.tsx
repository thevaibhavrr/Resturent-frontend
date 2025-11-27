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
  const totalDiscountData = location.state?.totalDiscount || 0;
  const additionalPriceData = location.state?.additionalPrice || 0;
  const isEdit = location.state?.isEdit || false;
  const originalBillId = location.state?.originalBillId;
  const originalBillNumber = location.state?.originalBillNumber;
  
  if (!tableData) {
    navigate("/order-tables");
    return null;
  }

  const handleBack = () => {
    navigate("/order-tables");
  };

  const handleSaveAndPrint = (printData: any) => {
    // Navigate to print bill page for printing
    navigate("/order-tables/print-bill", { state: printData, replace: true });
  };

  return (
    <BillPageComponent
      tableId={tableData.id}
      tableName={tableData.tableName}
      initialCart={cartData || []}
      initialPersons={personsData || 1}
      initialTotalDiscount={totalDiscountData}
      initialAdditionalPrice={additionalPriceData}
      onBack={handleBack}
      onSaveAndPrint={handleSaveAndPrint}
      isEdit={isEdit}
      originalBillId={originalBillId}
      originalBillNumber={originalBillNumber}
    />
  );
}
