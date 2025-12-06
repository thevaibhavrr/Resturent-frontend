import { useLocation, useNavigate } from "react-router-dom";
import { PrintDraftBill } from "../../components/PrintDraftBill";
import { toast } from "sonner";

export default function AdminPrintDraftPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const draftData = location.state;

  if (!draftData) {
    toast.error("No draft data found");
    navigate("/admin/order-tables");
    return null;
  }

  const handleBack = () => {
    navigate("/admin/order-tables");
  };

  return (
    <PrintDraftBill
      tableName={draftData.table.tableName}
      persons={draftData.persons}
      unprintedKots={draftData.unprintedKots}
      allKots={draftData.allKots}
      items={draftData.cart} // Fallback for legacy support
      onBack={handleBack}
    />
  );
}
