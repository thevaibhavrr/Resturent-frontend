import { useLocation, useNavigate } from "react-router-dom";
import { PrintDraftBill } from "../../components/PrintDraftBill";

export default function PrintDraftPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const tableData = location.state?.table;
  const cartData = location.state?.cart || [];
  const personsData = location.state?.persons || 1;
  const unprintedKots = location.state?.unprintedKots;
  const allKots = location.state?.allKots;

  if (!tableData) {
    navigate("/order-tables");
    return null;
  }

  const normalizedItems = cartData.map((it: any) => {
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
      tableName={tableData.tableName}
      persons={personsData}
      unprintedKots={unprintedKots}
      allKots={allKots}
      items={normalizedItems} // Fallback for legacy support
      onBack={() => navigate(-1)}
    />
  );
}
