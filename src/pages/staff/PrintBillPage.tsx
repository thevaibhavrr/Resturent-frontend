import { useLocation, useNavigate } from "react-router-dom";
import { PrintBill } from "../../components/PrintBill";

export default function PrintBillPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const printData = location.state?.printData;

  if (!printData) {
    navigate("/order-tables");
    return null;
  }

  const handleBack = () => {
    navigate("/order-tables");
  };

  return (
    <PrintBill
      billNumber={printData.billNumber}
      tableName={printData.tableName}
      persons={printData.persons}
      items={printData.items}
      additionalCharges={printData.additionalCharges || []}
      discountAmount={printData.discountAmount || 0}
      cgst={printData.cgst || 0}
      sgst={printData.sgst || 0}
      grandTotal={printData.grandTotal}
      onBack={handleBack}
      autoPrint={printData.autoPrint || false}
      redirectAfterPrint={printData.redirectAfterPrint || false}
    />
  );
}

