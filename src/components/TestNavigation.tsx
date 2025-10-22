import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

export function TestNavigation() {
  const navigate = useNavigate();

  const testNavigation = () => {
    console.log("Testing navigation to /staff/table-menu");
    const tableData = {
      id: 123,
      tableName: "Test Table",
      location: "Test Location",
      lastOrderTime: "-",
      persons: 0,
      totalAmount: 0,
      status: "available",
      cartItems: []
    };
    navigate("/staff/table-menu", { state: { table: tableData } });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Test Navigation</h2>
      <Button onClick={testNavigation}>
        Test Navigate to Staff Table Menu
      </Button>
    </div>
  );
}
