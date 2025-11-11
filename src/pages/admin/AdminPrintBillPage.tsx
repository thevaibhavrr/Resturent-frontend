import { useLocation, useNavigate } from "react-router-dom";
import { PrintBill } from "../../components/PrintBill";
import { toast } from "sonner";

export default function AdminPrintBillPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const printData = location.state;
  
  if (!printData) {
    toast.error("No print data found");
    navigate("/admin/order-tables");
    return null;
  }

  const handleBack = () => {
    navigate("/admin/order-tables");
  };

  return (
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
      onBack={handleBack}
    />
  );
}
