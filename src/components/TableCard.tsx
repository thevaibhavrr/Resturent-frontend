import { Users, Clock, DollarSign } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface TableCardProps {
  tableName: string;
  location: string;
  lastOrderTime: string;
  persons: number;
  totalAmount: number;
  status: "available" | "occupied" | "reserved";
  onClick?: () => void;
}

export function TableCard({
  tableName,
  location,
  lastOrderTime,
  persons,
  totalAmount,
  status,
  onClick,
}: TableCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "occupied":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "reserved":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  return (
    <Card 
      className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Table Name */}
        <div className="text-center mb-4">
          <h3 className="text-2xl tracking-wider">{tableName}</h3>
          <Badge className={`mt-2 ${getStatusColor()}`} variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Table Info */}
        <div className="space-y-3 mt-4">
          {status !== "available" && (
            <>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Order</span>
                </div>
                <span className="text-sm">{lastOrderTime}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Persons</span>
                </div>
                <span className="text-sm">{persons}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <span className="text-sm">₹{totalAmount}</span>
              </div>
            </>
          )}
          {status === "available" && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Table Available
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
