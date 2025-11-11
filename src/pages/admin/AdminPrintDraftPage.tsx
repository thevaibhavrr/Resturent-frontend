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

  // Normalize items to ensure they have spiceLevel and spicePercent
  const normalizedItems = (draftData.cart || []).map((it: any) => {
    let percent = typeof it.spicePercent === 'number' ? it.spicePercent : undefined;
    let level = typeof it.spiceLevel === 'number' ? it.spiceLevel : undefined;
    if (percent == null && level != null) {
      percent = Math.min(100, Math.max(1, level * 20));
    }
    if (level == null) {
      const p = percent != null ? percent : 50;
      level = Math.min(5, Math.max(1, Math.round(p / 20)));
    }
    if (percent == null) percent = 50;
    return { ...it, spiceLevel: level, spicePercent: percent };
  });

  return (
    <PrintDraftBill
      tableName={draftData.table.tableName}
      persons={draftData.persons}
      items={normalizedItems}
      onBack={handleBack}
    />
  );
}
